package com.ecommerce.payment_service.dto;

import lombok.*;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class BankDetailsDTO {
    public static final String DEMO_CBU = "0000003100010000000001";
    public static final String DEMO_CUIL = "20-12345678-9";
    public static final String DEMO_TITULAR = "Ecommerce Demo S.A.";
    public static final String DEMO_ALIAS = "ECOMMERCE.DEMO.ARS";
    public static final String DEMO_BANK = "Banco Demo Santander Río";
    public static final String DEMO_ACCOUNT_TYPE = "Cuenta Corriente en Pesos";

    @Builder.Default
    private String cbu = DEMO_CBU;

    @Builder.Default
    private String cuil = DEMO_CUIL;

    @Builder.Default
    private String titular = DEMO_TITULAR;

    @Builder.Default
    private String alias = DEMO_ALIAS;

    @Builder.Default
    private String bank = DEMO_BANK;

    @Builder.Default
    private String accountType = DEMO_ACCOUNT_TYPE;

    public static BankDetailsDTO defaultDemoDetails() {
        return BankDetailsDTO.builder().build();
    }
}
