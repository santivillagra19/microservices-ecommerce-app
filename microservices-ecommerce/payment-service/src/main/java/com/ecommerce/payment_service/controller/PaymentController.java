package com.ecommerce.payment_service.controller;

import com.ecommerce.payment_service.dto.*;
import com.ecommerce.payment_service.service.PaymentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;

@RestController
@RequestMapping("/api/v1/payment")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Payment", description = "Endpoints for processing and querying payments")
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/session")
    @Operation(summary = "Create payment session", description = "Creates a new payment session for an order")
    public ResponseEntity<PaymentSessionResponse> createSession(@Valid @RequestBody PaymentSessionRequest request) {
        log.info("Received session creation request for order: {}", request.getOrderNumber());
        PaymentSessionResponse response = paymentService.createSession(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/process")
    @Operation(summary = "Process card payment", description = "Processes a card payment for an active session")
    public ResponseEntity<PaymentResponse> processCardPayment(@Valid @RequestBody CardPaymentRequest request) {
        log.info("Received card payment process request for session: {}", request.getSessionId());
        PaymentResponse response = paymentService.processCardPayment(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/bank-transfer/confirm")
    @Operation(summary = "Confirm bank transfer", description = "Confirms a bank transfer for a payment session")
    public ResponseEntity<PaymentResponse> confirmBankTransfer(@Valid @RequestBody BankTransferConfirmRequest request) {
        log.info("Received bank transfer confirmation request for session: {}", request.getSessionId());
        int maxAttempts = 3;
        for (int attempt = 1; attempt <= maxAttempts; attempt++) {
            try {
                PaymentResponse response = paymentService.confirmBankTransfer(request);
                return ResponseEntity.ok(response);
            } catch (org.springframework.dao.ConcurrencyFailureException | org.springframework.dao.DataIntegrityViolationException e) {
                log.warn("Concurrency conflict on bank transfer confirmation for session: {} (attempt {}/{})",
                        request.getSessionId(), attempt, maxAttempts);
                if (attempt == maxAttempts) {
                    throw e;
                }
                try {
                    Thread.sleep(20L * attempt);
                } catch (InterruptedException ie) {
                    Thread.currentThread().interrupt();
                    throw e;
                }
            }
        }
        throw new IllegalStateException("Unexpected execution branch in confirmBankTransfer");
    }

    @GetMapping("/bank-transfer/details")
    @Operation(summary = "Get bank transfer details", description = "Retrieves instructions and details for performing a bank transfer")
    public ResponseEntity<BankDetailsDTO> getBankTransferDetails() {
        log.info("Received request for bank transfer details");
        return ResponseEntity.ok(paymentService.getBankTransferDetails());
    }

    @GetMapping("/session/{sessionId}")
    @Operation(summary = "Get status by session ID", description = "Retrieves the payment status using the session ID")
    public ResponseEntity<PaymentStatusResponse> getStatusBySessionId(@PathVariable String sessionId) {
        log.info("Querying payment status for session: {}", sessionId);
        PaymentStatusResponse response = paymentService.getStatusBySessionId(sessionId);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/status/{orderNumber}")
    @Operation(summary = "Get status by order number", description = "Retrieves the payment status using the order number")
    public ResponseEntity<PaymentStatusResponse> getStatusByOrderNumber(@PathVariable String orderNumber) {
        log.info("Querying payment status for orderNumber: {}", orderNumber);
        PaymentStatusResponse response = paymentService.getStatusByOrderNumber(orderNumber);
        return ResponseEntity.ok(response);
    }
}
