package com.ecommerce.payment_service.dto;

import com.ecommerce.payment_service.model.PaymentStatus;
import lombok.*;

import java.time.Instant;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PaymentResponse {
    private String paymentId;
    private String sessionId;
    private String orderNumber;
    private PaymentStatus status;
    private String statusDetail;
    private String message;
    private String paymentMethod;
    private BankDetailsDTO bankDetails;
    private Instant dateApproved;
}
