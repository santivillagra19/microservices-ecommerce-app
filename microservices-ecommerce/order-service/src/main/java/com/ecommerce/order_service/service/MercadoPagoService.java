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

@Service
@Slf4j
public class MercadoPagoService {

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
