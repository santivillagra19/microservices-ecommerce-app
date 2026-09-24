package com.ecommerce.payment_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = false)
public class CardPaymentRequest {

    @NotBlank(message = "Session ID is mandatory")
    private String sessionId;

    @NotBlank(message = "Card token is mandatory")
    private String token;

    @NotBlank(message = "Payment method ID is mandatory")
    private String paymentMethodId;

    @NotNull(message = "Installments are mandatory")
    @Min(value = 1, message = "Installments must be at least 1")
    private Integer installments;

    private String issuerId;

    @NotBlank(message = "Payer email is mandatory")
    @Email(message = "Invalid payer email format")
    private String payerEmail;

    private String identificationType;
    private String identificationNumber;
    private String idempotencyKey;
}
