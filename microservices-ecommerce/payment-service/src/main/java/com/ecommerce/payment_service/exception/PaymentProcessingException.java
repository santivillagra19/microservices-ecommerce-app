package com.ecommerce.payment_service.exception;

import lombok.Getter;

@Getter
public class PaymentProcessingException extends RuntimeException {
    private final String userFriendlyMessage;

    public PaymentProcessingException(String message) {
        super(message);
        this.userFriendlyMessage = message;
    }

    public PaymentProcessingException(String message, String userFriendlyMessage) {
        super(message);
        this.userFriendlyMessage = userFriendlyMessage;
    }
}
