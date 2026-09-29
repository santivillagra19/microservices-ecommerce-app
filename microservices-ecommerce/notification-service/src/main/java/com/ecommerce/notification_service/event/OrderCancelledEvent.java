package com.ecommerce.notification_service.event;


import java.util.List;

public record OrderCancelledEvent(String orderNumber, String email, String reason, List<OrderItemEvent> items) {
    public record OrderItemEvent(String sku, String price, Integer quantity) {}
}
