package com.ecommerce.inventory_service.listener;

import com.ecommerce.inventory_service.event.OrderCancelledEvent;
import com.ecommerce.inventory_service.event.OrderPlacedEvent;
import com.ecommerce.inventory_service.model.ProcessedEvent;
import com.ecommerce.inventory_service.repository.ProcessedEventRepository;
import com.ecommerce.inventory_service.service.InventoryService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@RequiredArgsConstructor
@Component
@Slf4j
public class OrderEventsListener {

    private final InventoryService inventoryService;
    private final RabbitTemplate rabbitTemplate;
    private final ProcessedEventRepository processedEventRepository;

    @RabbitListener(queues = "inventory-queue")
    public void handleOrderPlacedEvent(OrderPlacedEvent event){
        String eventId = event.orderNumber() + "_PLACED";
        if (processedEventRepository.existsById(eventId)) {
            log.info("Ignorando evento duplicado para reserva de orden: {}", event.orderNumber());
            return;
        }

        log.info("Evento recibido en Inventario para Orden: {}", event.orderNumber());

        try {
            boolean allProductsInStock = event.items().stream()
                            .allMatch(item -> inventoryService.isInStock(item.sku(), item.quantity()));

            if(!allProductsInStock){
                cancelOrder(event, "Stock insuficiente en uno o más productos");
                return;
            }

            event.items().forEach(item -> {
                inventoryService.reduceStock(item.sku(), item.quantity());
            });

            processedEventRepository.save(new ProcessedEvent(eventId, LocalDateTime.now()));
            log.info("Stock descontado (reservado) por SKU para la orden: {}", event.orderNumber());

        } catch(Exception e) {
            log.error("Error inesperado: {}", e.getMessage());
            cancelOrder(event, "Error técnico de procesamiento de inventario");
        }
    }

    private void cancelOrder(OrderPlacedEvent event, String reason){
        java.util.List<OrderCancelledEvent.OrderItemEvent> cancelledItems = event.items().stream()
            .map(item -> new OrderCancelledEvent.OrderItemEvent(item.sku(), item.price(), item.quantity()))
            .toList();

        OrderCancelledEvent cancelledEvent = new OrderCancelledEvent(
                event.orderNumber(), event.email(), reason, cancelledItems
        );

        rabbitTemplate.convertAndSend("order-events", "order.cancelled", cancelledEvent);
    }

    @RabbitListener(queues = "inventory-cancelled-queue")
    public void handleOrderCancelledEvent(OrderCancelledEvent event) {
        String eventId = event.orderNumber() + "_CANCELLED";
        if (processedEventRepository.existsById(eventId)) {
            log.info("Ignorando evento duplicado para cancelación de orden: {}", event.orderNumber());
            return;
        }

        log.info("Evento recibido de cancelación para restaurar stock. Orden: {}", event.orderNumber());
        if (event.items() != null) {
            event.items().forEach(item -> {
                try {
                    inventoryService.addStock(item.sku(), item.quantity());
                    log.info("Stock restaurado por SKU: {} - Cantidad {}", item.sku(), item.quantity());
                } catch (Exception e) {
                    log.error("Error restaurando stock para SKU: {}. {}", item.sku(), e.getMessage());
                }
            });
            processedEventRepository.save(new ProcessedEvent(eventId, LocalDateTime.now()));
        }
    }
}
