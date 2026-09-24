package com.ecommerce.payment_service.dto;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = false)
public class BankTransferConfirmRequest {

    @NotBlank(message = "Session ID is mandatory")
    private String sessionId;

    private String voucherNumber;
}
