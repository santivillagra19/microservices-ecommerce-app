package com.ecommerce.order_service.listener;

import com.ecommerce.order_service.event.OrderCancelledEvent;
import com.ecommerce.order_service.event.OrderConfirmedEvent;
import com.ecommerce.order_service.model.OrderStatus;
import com.ecommerce.order_service.service.OrderService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.stereotype.Component;

@Component
@Slf4j
@RequiredArgsConstructor
public class OrderEventsListener {

    private final OrderService orderService;

    @RabbitListener(queues = "order-confirmed-queue")
    public void handleOrderConfirmedEvent(OrderConfirmedEvent confirmedEvent) {
        orderService.updateOrderStatus(confirmedEvent.orderNumber(), OrderStatus.CONFIRMED);
    }

    @RabbitListener(queues = "order-cancelled-queue")
    public void handleOrderCancelledEvent(OrderCancelledEvent cancelledEvent) {
        orderService.updateOrderStatus(cancelledEvent.orderNumber(), OrderStatus.CANCELLED);
        log.info("Orden {} cancelada. Motivo: {}", cancelledEvent.orderNumber(), cancelledEvent.reason());
    }
}
