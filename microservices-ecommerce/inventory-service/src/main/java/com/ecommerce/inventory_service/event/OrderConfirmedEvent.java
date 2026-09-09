package com.ecommerce.inventory_service.event;

import lombok.Builder;

@Builder
public record OrderConfirmedEvent(String orderNumber, String email) {



}
