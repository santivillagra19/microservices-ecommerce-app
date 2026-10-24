package com.ecommerce.order_service.service;

import com.ecommerce.order_service.event.OrderConfirmedEvent;
import com.ecommerce.order_service.exception.PaymentVerificationException;
import com.ecommerce.order_service.model.Order;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.repository.OrderRepository;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.payment.Payment;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentConfirmationService {
    private final OrderRepository orderRepository;
    private final RabbitTemplate rabbitTemplate;

    @Transactional
    public void process(Payment payment) throws MPException, MPApiException {
        Long paymentId = payment.getId();
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
                            refundClient.refund(paymentId);
                            log.info("Dinero devuelto exitosamente para el pago {}", paymentId);
                        } catch (MPException | MPApiException e) {
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

    }

    private void validatePayment(Payment payment, Order order) {
        BigDecimal total = order.getOrderLineItemsList().stream()
                .map(item -> item.getPrice().multiply(BigDecimal.valueOf(item.getQuantity())))
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        if (!"ARS".equals(payment.getCurrencyId()) || payment.getTransactionAmount() == null
                || total.compareTo(payment.getTransactionAmount()) != 0) {
            throw new PaymentVerificationException("El importe o la moneda del pago no coincide con el pedido");
        }
    }

}
