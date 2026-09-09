package com.ecommerce.notification_service.event;


public record OrderCancelledEvent(String orderNumber, String email, String reason) {


}
