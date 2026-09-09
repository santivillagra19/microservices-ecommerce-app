package com.ecommerce.order_service.event;

import lombok.Builder;

@Builder
public record OrderConfirmedEvent(String orderNumber, String email) {



}
