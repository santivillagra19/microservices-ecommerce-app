package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.event.OrderConfirmedEvent;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.exceptions.MPInvalidWebhookSignatureException;
import com.mercadopago.webhook.WebhookSignatureValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.Optional;

@RestController
@RequestMapping("/api/v1/webhook")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookController {

    private final OrderRepository orderRepository;
    private final RabbitTemplate rabbitTemplate;

    @Value("${mercadopago.access-token:}")
    private String mpAccessToken;

    @Value("${mercadopago.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/mercadopago")
    @Transactional
    public ResponseEntity<String> handleMercadoPagoWebhook(
            @RequestParam(name = "data.id", required = false) String paymentId,
            @RequestHeader(name = "x-signature", required = false) String signature,
            @RequestHeader(name = "x-request-id", required = false) String requestId) {

        if (webhookSecret == null || webhookSecret.isBlank() || mpAccessToken == null || mpAccessToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Webhook no configurado");
        }
        if (paymentId == null || !paymentId.matches("[1-9][0-9]{0,17}")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Identificador de pago invalido");
        }
        try {
            WebhookSignatureValidator.validate(signature, requestId, paymentId, webhookSecret);
        } catch (MPInvalidWebhookSignatureException e) {
            log.warn("Webhook de Mercado Pago rechazado por firma invalida");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Firma invalida");
        }

        try {
            MercadoPagoConfig.setAccessToken(mpAccessToken);
            PaymentClient client = new PaymentClient();
            Payment payment = client.get(Long.parseLong(paymentId));

            if ("approved".equals(payment.getStatus())) {
                String orderNumber = payment.getExternalReference();
                log.info("Pago APROBADO para la orden: {}", orderNumber);

                Optional<Order> orderOpt = orderRepository.findByOrderNumberForUpdate(orderNumber);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    validatePayment(payment, order);
                    if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                        log.warn("La orden {} ya fue CANCELADA (probablemente por falta de stock). Se procederá a devolver el dinero.", orderNumber);
                        
                        try {
                            com.mercadopago.client.payment.PaymentRefundClient refundClient = new com.mercadopago.client.payment.PaymentRefundClient();
                            refundClient.refund(Long.parseLong(paymentId));
                            log.info("Dinero devuelto exitosamente para el pago {}", paymentId);
                        } catch (Exception e) {
                            log.error("No se pudo devolver el pago {}", paymentId);
                            throw e;
                        }
                    } else if (order.getOrderStatus() != OrderStatus.CONFIRMED) {
                        order.setOrderStatus(OrderStatus.CONFIRMED);
                        orderRepository.save(order);

                        // Emitir evento
                        OrderConfirmedEvent confirmedEvent = new OrderConfirmedEvent(order.getOrderNumber(), order.getEmail()); 
                        
                        rabbitTemplate.convertAndSend("order-events", "order.confirmed", confirmedEvent);
                        log.info("Evento order.confirmed emitido exitosamente para {}", orderNumber);
                    } else {
                        log.info("La orden {} ya estaba confirmada", orderNumber);
                    }
                } else {
                    log.error("Orden {} no encontrada en la base de datos", orderNumber);
                }
            } else if ("rejected".equals(payment.getStatus()) || "cancelled".equals(payment.getStatus())) {
                String orderNumber = payment.getExternalReference();
                log.info("Pago RECHAZADO/CANCELADO para la orden: {}", orderNumber);

                Optional<Order> orderOpt = orderRepository.findByOrderNumberForUpdate(orderNumber);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    validatePayment(payment, order);
                    if (order.getOrderStatus() != OrderStatus.CANCELLED && order.getOrderStatus() != OrderStatus.CONFIRMED) {
                        order.setOrderStatus(OrderStatus.CANCELLED);
                        orderRepository.save(order);

                        java.util.List<com.ecommerce.order_service.event.OrderCancelledEvent.OrderItemEvent> cancelledItems = order.getOrderLineItemsList().stream()
                            .map(item -> new com.ecommerce.order_service.event.OrderCancelledEvent.OrderItemEvent(item.getSku(), item.getPrice().toString(), item.getQuantity()))
                            .toList();

                        com.ecommerce.order_service.event.OrderCancelledEvent cancelledEvent = new com.ecommerce.order_service.event.OrderCancelledEvent(
                            order.getOrderNumber(), order.getEmail(), "Pago rechazado por MercadoPago", cancelledItems
                        );
                        
                        rabbitTemplate.convertAndSend("order-events", "order.cancelled", cancelledEvent);
                        log.info("Evento order.cancelled emitido exitosamente para {}", orderNumber);
                    }
                }
            } else {
                log.info("El estado del pago {} es: {}", paymentId, payment.getStatus());
            }

        } catch (Exception e) {
            log.error("No se pudo procesar el pago {} del webhook", paymentId);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo procesar la notificacion. Reintente mas tarde.", e);
        }

        return ResponseEntity.ok("OK");
    }
    private void validatePayment(Payment payment, Order order) {
        BigDecimal total = order.getOrderLineItemsList().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (!"ARS".equals(payment.getCurrencyId()) || payment.getTransactionAmount() == null
                || total.compareTo(payment.getTransactionAmount()) != 0) {
            throw new IllegalStateException("El importe o la moneda del pago no coincide con el pedido");
        }
    }

}
