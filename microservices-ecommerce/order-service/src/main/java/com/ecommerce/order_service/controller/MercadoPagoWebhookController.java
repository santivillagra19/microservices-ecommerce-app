package com.ecommerce.order_service.controller;

import com.ecommerce.order_service.service.PaymentConfirmationService;
import com.ecommerce.order_service.exception.PaymentVerificationException;
import com.mercadopago.exceptions.MPException;
import com.mercadopago.exceptions.MPApiException;
import org.springframework.amqp.AmqpException;
import org.springframework.dao.DataAccessException;
import com.mercadopago.MercadoPagoConfig;
import com.mercadopago.client.payment.PaymentClient;
import com.mercadopago.resources.payment.Payment;
import com.mercadopago.exceptions.MPInvalidWebhookSignatureException;
import com.mercadopago.webhook.WebhookSignatureValidator;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.web.bind.annotation.*;


@RestController
@RequestMapping("/api/v1/webhook")
@RequiredArgsConstructor
@Slf4j
public class MercadoPagoWebhookController {

    private final PaymentConfirmationService paymentConfirmationService;

    @Value("${mercadopago.access-token:}")
    private String mpAccessToken;

    @Value("${mercadopago.webhook-secret:}")
    private String webhookSecret;

    @PostMapping("/mercadopago")
    public ResponseEntity<String> handleMercadoPagoWebhook(
            @RequestParam(name = "data.id", required = false) String paymentId,
            @RequestHeader(name = "x-signature", required = false) String signature,
            @RequestHeader(name = "x-request-id", required = false) String requestId) {

        if (webhookSecret == null || webhookSecret.isBlank() || mpAccessToken == null || mpAccessToken.isBlank()) {
            return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE).body("Webhook no configurado");
        }
        if (paymentId == null || !paymentId.matches("[1-9][0-9]{0,17}")) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body("Identificador de pago invalido");
        }
        try {
            WebhookSignatureValidator.validate(signature, requestId, paymentId, webhookSecret);
        } catch (MPInvalidWebhookSignatureException e) {
            log.warn("Webhook de Mercado Pago rechazado por firma invalida");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body("Firma invalida");
        }

        try {
            MercadoPagoConfig.setAccessToken(mpAccessToken);
            PaymentClient client = new PaymentClient();
            Payment payment = client.get(Long.parseLong(paymentId));

            paymentConfirmationService.process(payment);

        } catch (MPException | MPApiException | PaymentVerificationException | AmqpException | DataAccessException | IllegalArgumentException e) {
            log.error("No se pudo procesar el pago {} del webhook", paymentId);
            throw new ResponseStatusException(HttpStatus.SERVICE_UNAVAILABLE,
                    "No se pudo procesar la notificacion. Reintente mas tarde.", e);
        }

        return ResponseEntity.ok("OK");
    }
}
