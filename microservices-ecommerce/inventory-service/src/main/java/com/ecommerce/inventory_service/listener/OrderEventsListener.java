package com.ecommerce.inventory_service.listener;


import com.ecommerce.inventory_service.event.OrderCancelledEvent;
import com.ecommerce.inventory_service.event.OrderConfirmedEvent;
import com.ecommerce.inventory_service.event.OrderPlacedEvent;
import com.ecommerce.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

@RequiredArgsConstructor
@Component
@Slf4j
public class OrderEventsListener {

    private final InventoryService inventoryService;
    private final RabbitTemplate rabbitTemplate;

    @RabbitListener(queues = "inventory-queue")
    public void handleOrderPlacedEvent(OrderPlacedEvent event){
        log.info("Evento recibido en Inventario para Orden: {}", event.orderNumber());

            try{
                boolean allProductsInStock = event.items().stream()
                                .allMatch(item -> inventoryService.isInStock(item.sku(), item.quantity()));

                if(!allProductsInStock){
                    cancelOrder(event, "Stock insuficiente en uno o más productos");
                    return;
                }

                event.items().forEach(item -> {
                    inventoryService.reduceStock(item.sku(), item.quantity());
                });

                OrderConfirmedEvent confirmedEvent = new OrderConfirmedEvent(event.orderNumber(), event.email());
                rabbitTemplate.convertAndSend("order-events", "order.confirmed", confirmedEvent);

                log.info("Stock descontado por SKU: {} - Cantidad {}", event.orderNumber());

            } catch(Exception e){
                log.error("Error inesperado: {}", e.getMessage());
                cancelOrder(event, "Error técnico de procesamiento de inventario");
            }
    }

    private void cancelOrder(OrderPlacedEvent event, String reason){
        OrderCancelledEvent cancelledEvent = new OrderCancelledEvent(
                event.orderNumber(), event.email(), reason
        );

        rabbitTemplate.convertAndSend("order-events", "order.cancelled", cancelledEvent);
    }
}
