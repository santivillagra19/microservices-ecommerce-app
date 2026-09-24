package com.ecommerce.payment_service.config;

import com.mercadopago.MercadoPagoConfig;
import jakarta.annotation.PostConstruct;
import lombok.Getter;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

@Configuration
@Slf4j
@Getter
public class MercadoPagoConfiguration {

    @Value("${mercadopago.access-token:${MERCADOPAGO_ACCESS_TOKEN:}}")
    private String accessToken;

    @Value("${mercadopago.mock.enabled:false}")
    private boolean mockEnabled;

    @PostConstruct
    public void initMercadoPago() {
        if (accessToken != null && !accessToken.isBlank() && !accessToken.startsWith("${")) {
            MercadoPagoConfig.setAccessToken(accessToken);
            String masked = accessToken.length() > 8 ? accessToken.substring(0, 8) + "****" : "****";
            log.info("MercadoPago SDK initialized with configured access token (masked: {})", masked);
        } else {
            log.warn("MERCADOPAGO_ACCESS_TOKEN is not configured or contains placeholder. Mock fallback will be active for simulated testing.");
        }
    }
}
