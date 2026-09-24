package com.ecommerce.payment_service.dto;

import com.ecommerce.payment_service.model.PaymentMethod;
import com.ecommerce.payment_service.model.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentStatusResponse {
    private String sessionId;
    private String orderNumber;
    private PaymentStatus status;
    private Instant expiresAt;
    private long remainingSeconds;
    private PaymentMethod paymentMethod;
    private BigDecimal amount;
    private String currency;
}
