package com.ecommerce.payment_service.event;

import lombok.Builder;

import java.io.Serializable;

@Builder
public record OrderConfirmedEvent(String orderNumber, String email) implements Serializable {
}
