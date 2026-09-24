package com.ecommerce.payment_service.dto;

import com.ecommerce.payment_service.model.PaymentStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentSessionResponse {
    private String sessionId;
    private String orderNumber;
    private String email;
    private BigDecimal totalAmount;
    private String currency;
    private PaymentStatus status;
    private Instant createdAt;
    private Instant expiresAt;
    private long remainingSeconds;
}
