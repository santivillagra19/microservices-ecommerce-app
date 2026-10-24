package com.ecommerce.order_service.service;

import com.mercadopago.client.preference.PreferenceClient;
import com.mercadopago.client.preference.PreferenceRequest;
import com.mercadopago.exceptions.MPApiException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.resources.preference.Preference;
import io.github.resilience4j.circuitbreaker.annotation.CircuitBreaker;
import io.github.resilience4j.retry.annotation.Retry;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.beans.factory.annotation.Value;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.core.MPRequestOptions;
import com.mercadopago.net.MPSearchRequest;
import com.mercadopago.resources.payment.Payment;
import java.util.Map;
import java.util.Optional;

@Service
@Slf4j
public class MercadoPagoService {

    @Value("${mercadopago.access-token:}")
    private String accessToken;

    public Optional<Payment> findApprovedPayment(String orderNumber) throws MPException, MPApiException {
        MPSearchRequest request = MPSearchRequest.builder().limit(1).offset(0)
                .filters(Map.of("external_reference", orderNumber, "status", "approved",
                        "sort", "date_created", "criteria", "desc")).build();
        return new PaymentClient().search(request, MPRequestOptions.builder().accessToken(accessToken).build())
                .getResults().stream()
                .filter(payment -> orderNumber.equals(payment.getExternalReference()) && "approved".equals(payment.getStatus()))
                .findFirst();
    }

    @CircuitBreaker(name = "mercadopago", fallbackMethod = "fallbackCreatePreference")
    @Retry(name = "mercadopago")
    public Preference createPreference(PreferenceRequest request) throws MPException, MPApiException {
        log.info("Llamando a la API de MercadoPago para crear preferencia...");
        PreferenceClient client = new PreferenceClient();
        return client.create(request);
    }

    public Preference fallbackCreatePreference(PreferenceRequest request, Throwable t) {
        log.error("Circuit Breaker / Fallback activado para MercadoPago tras varios intentos fallidos. Motivo: {}", t.getMessage());
        return null;
    }
}
