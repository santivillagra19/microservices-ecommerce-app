package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.event.OrderConfirmedEvent;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
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

    @PostMapping("/mercadopago")
    public ResponseEntity<String> handleMercadoPagoWebhook(
            @RequestParam(required = false) String topic,
            @RequestParam(required = false) String id,
            @RequestBody(required = false) Map<String, Object> body) {

        log.info("Webhook recibido de MercadoPago. Topic: {}, ID: {}, Body: {}", topic, id, body);

        try {
            String paymentId = null;

            // Intentar extraer de query params (MercadoPago manda as a veces)
            if ("payment".equals(topic) && id != null) {
                paymentId = id;
            } 
            // Intentar extraer del body
            else if (body != null && body.containsKey("type") && "payment".equals(body.get("type"))) {
                if (body.containsKey("data")) {
                    Map<String, Object> data = (Map<String, Object>) body.get("data");
                    if (data.containsKey("id")) {
                        paymentId = data.get("id").toString();
                    }
                }
            }

            if (paymentId == null) {
                log.warn("No se pudo extraer el payment ID del webhook");
                return ResponseEntity.ok("OK"); // MercadoPago necesita un 200 siempre
            }

            log.info("Procesando pago con ID: {}", paymentId);

            MercadoPagoConfig.setAccessToken(mpAccessToken);
            PaymentClient client = new PaymentClient();
            Payment payment = client.get(Long.parseLong(paymentId));

            if ("approved".equals(payment.getStatus())) {
                String orderNumber = payment.getExternalReference();
                log.info("Pago APROBADO para la orden: {}", orderNumber);

                Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    if (order.getOrderStatus() == OrderStatus.CANCELLED) {
                        log.warn("La orden {} ya fue CANCELADA (probablemente por falta de stock). Se procederá a devolver el dinero.", orderNumber);
                        
                        try {
                            com.mercadopago.client.payment.PaymentRefundClient refundClient = new com.mercadopago.client.payment.PaymentRefundClient();
                            refundClient.refund(Long.parseLong(paymentId));
                            log.info("Dinero devuelto exitosamente para el pago {}", paymentId);
                        } catch (Exception e) {
                            log.error("Error al intentar devolver el dinero del pago {}: {}", paymentId, e.getMessage());
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

                Optional<Order> orderOpt = orderRepository.findByOrderNumber(orderNumber);
                if (orderOpt.isPresent()) {
                    Order order = orderOpt.get();
                    if (order.getOrderStatus() != OrderStatus.CANCELLED) {
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
            log.error("Error procesando webhook de MercadoPago: {}", e.getMessage());
        }

        return ResponseEntity.ok("OK");
    }
}
