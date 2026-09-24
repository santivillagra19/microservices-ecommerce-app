package com.ecommerce.payment_service.service.impl;

import com.ecommerce.payment_service.dto.*;
import com.ecommerce.payment_service.exception.InvalidSessionStateException;
import com.ecommerce.payment_service.exception.ResourceNotFoundException;
import com.ecommerce.payment_service.exception.SessionExpiredException;
import com.ecommerce.payment_service.model.*;
import com.ecommerce.payment_service.repository.PaymentRecordRepository;
import com.ecommerce.payment_service.repository.PaymentSessionRepository;
import com.ecommerce.payment_service.service.MercadoPagoClient;
import com.ecommerce.payment_service.service.PaymentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentServiceImpl implements PaymentService {

    private final PaymentSessionRepository sessionRepository;
    private final PaymentRecordRepository recordRepository;
    private final MercadoPagoClient mercadoPagoClient;

    public static final Duration SESSION_DURATION = Duration.ofMinutes(10);

    @Override
    @Transactional
    public PaymentSessionResponse createSession(PaymentSessionRequest request) {
        log.info("Creating payment session for order: {}, email: {}", request.getOrderNumber(), request.getEmail());

        Instant now = Instant.now();
        Instant expiresAt = now.plus(SESSION_DURATION);
        String sessionId = "sess_" + UUID.randomUUID().toString().replace("-", "");

        List<OrderItemEmbeddable> items = request.getItems() != null
                ? request.getItems().stream()
                .map(item -> OrderItemEmbeddable.builder()
                        .sku(item.getSku())
                        .quantity(item.getQuantity())
                        .price(item.getPrice())
                        .build())
                .collect(Collectors.toList())
                : List.of();

        PaymentSession session = PaymentSession.builder()
                .sessionId(sessionId)
                .orderNumber(request.getOrderNumber())
                .email(request.getEmail())
                .totalAmount(request.getTotalAmount())
                .currency(request.getCurrency() != null ? request.getCurrency() : "ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(now)
                .expiresAt(expiresAt)
                .items(items)
                .build();

        sessionRepository.save(session);

        return PaymentSessionResponse.builder()
                .sessionId(session.getSessionId())
                .orderNumber(session.getOrderNumber())
                .email(session.getEmail())
                .totalAmount(session.getTotalAmount())
                .currency(session.getCurrency())
                .status(session.getStatus())
                .createdAt(session.getCreatedAt())
                .expiresAt(session.getExpiresAt())
                .remainingSeconds(session.getRemainingSeconds())
                .build();
    }

    @Override
    @Transactional(noRollbackFor = SessionExpiredException.class)
    public PaymentResponse processCardPayment(CardPaymentRequest request) {
        PaymentSession session = getAndValidateActiveSession(request.getSessionId());

        PaymentResponse mpResponse = mercadoPagoClient.processPayment(
                request,
                session.getTotalAmount(),
                session.getOrderNumber()
        );

        if (mpResponse.getStatus() == PaymentStatus.APPROVED) {
            session.setStatus(PaymentStatus.APPROVED);
        } else if (mpResponse.getStatus() == PaymentStatus.REJECTED) {
            session.setStatus(PaymentStatus.REJECTED);
        } else {
            session.setStatus(mpResponse.getStatus());
        }
        session.setPaymentMethod(PaymentMethod.MERCADOPAGO.name());
        sessionRepository.save(session);

        PaymentRecord record = PaymentRecord.builder()
                .paymentId(mpResponse.getPaymentId())
                .sessionId(session.getSessionId())
                .orderNumber(session.getOrderNumber())
                .paymentMethod(PaymentMethod.MERCADOPAGO)
                .status(mpResponse.getStatus())
                .amount(session.getTotalAmount())
                .currency(session.getCurrency())
                .payerEmail(request.getPayerEmail())
                .details(mpResponse.getMessage())
                .createdAt(Instant.now())
                .build();

        recordRepository.save(record);

        return mpResponse;
    }

    @Override
    @Transactional(noRollbackFor = SessionExpiredException.class)
    public PaymentResponse confirmBankTransfer(BankTransferConfirmRequest request) {
        PaymentSession session = sessionRepository.findBySessionId(request.getSessionId())
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "sessionId", request.getSessionId()));

        if (session.isExpired()) {
            if (session.getStatus() != PaymentStatus.EXPIRED) {
                session.setStatus(PaymentStatus.EXPIRED);
                sessionRepository.save(session);
            }
            throw new SessionExpiredException("Payment session has expired. Please initiate a new payment session.");
        }

        // Idempotency: if already confirmed, return existing confirmation
        if (session.getStatus() == PaymentStatus.CONFIRMED) {
            log.info("Session {} is already confirmed, returning existing confirmation", session.getSessionId());
            return PaymentResponse.builder()
                    .sessionId(session.getSessionId())
                    .status(PaymentStatus.CONFIRMED)
                    .orderNumber(session.getOrderNumber())
                    .message("Bank transfer already confirmed")
                    .paymentMethod(PaymentMethod.BANK_TRANSFER.name())
                    .bankDetails(BankDetailsDTO.defaultDemoDetails())
                    .build();
        }

        // Reject already approved, cancelled, or failed sessions
        if (session.getStatus() == PaymentStatus.APPROVED ||
            session.getStatus() == PaymentStatus.CANCELLED ||
            session.getStatus() == PaymentStatus.FAILED) {
            throw new InvalidSessionStateException("Session already processed with status " + session.getStatus());
        }

        String paymentId = "bt_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        session.setStatus(PaymentStatus.CONFIRMED);
        session.setPaymentMethod(PaymentMethod.BANK_TRANSFER.name());
        session.setStatusDetail("transfer_confirmed");
        sessionRepository.save(session);

        BankDetailsDTO bankDetails = BankDetailsDTO.defaultDemoDetails();

        PaymentRecord record = PaymentRecord.builder()
                .paymentId(paymentId)
                .sessionId(session.getSessionId())
                .orderNumber(session.getOrderNumber())
                .paymentMethod(PaymentMethod.BANK_TRANSFER)
                .status(PaymentStatus.CONFIRMED)
                .amount(session.getTotalAmount())
                .currency(session.getCurrency())
                .payerEmail(session.getEmail())
                .details("Bank transfer confirmed for CBU " + bankDetails.getCbu())
                .createdAt(Instant.now())
                .build();

        recordRepository.save(record);

        return PaymentResponse.builder()
                .paymentId(paymentId)
                .sessionId(session.getSessionId())
                .status(PaymentStatus.CONFIRMED)
                .orderNumber(session.getOrderNumber())
                .message("Bank transfer confirmed successfully")
                .paymentMethod(PaymentMethod.BANK_TRANSFER.name())
                .bankDetails(bankDetails)
                .dateApproved(Instant.now())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getStatusBySessionId(String sessionId) {
        PaymentSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "sessionId", sessionId));

        checkAndApplyExpiry(session);

        PaymentMethod method = recordRepository.findBySessionId(sessionId).stream()
                .findFirst()
                .map(PaymentRecord::getPaymentMethod)
                .orElse(null);

        return PaymentStatusResponse.builder()
                .sessionId(session.getSessionId())
                .orderNumber(session.getOrderNumber())
                .status(session.getStatus())
                .expiresAt(session.getExpiresAt())
                .remainingSeconds(session.getRemainingSeconds())
                .paymentMethod(method)
                .amount(session.getTotalAmount())
                .currency(session.getCurrency())
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public PaymentStatusResponse getStatusByOrderNumber(String orderNumber) {
        PaymentSession session = sessionRepository.findByOrderNumber(orderNumber)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "orderNumber", orderNumber));

        checkAndApplyExpiry(session);

        PaymentMethod method = recordRepository.findByOrderNumber(orderNumber).stream()
                .findFirst()
                .map(PaymentRecord::getPaymentMethod)
                .orElse(null);

        return PaymentStatusResponse.builder()
                .sessionId(session.getSessionId())
                .orderNumber(session.getOrderNumber())
                .status(session.getStatus())
                .expiresAt(session.getExpiresAt())
                .remainingSeconds(session.getRemainingSeconds())
                .paymentMethod(method)
                .amount(session.getTotalAmount())
                .currency(session.getCurrency())
                .build();
    }

    @Override
    public BankDetailsDTO getBankTransferDetails() {
        return BankDetailsDTO.defaultDemoDetails();
    }

    private PaymentSession getAndValidateActiveSession(String sessionId) {
        PaymentSession session = sessionRepository.findBySessionId(sessionId)
                .orElseThrow(() -> new ResourceNotFoundException("PaymentSession", "sessionId", sessionId));

        if (session.isExpired()) {
            if (session.getStatus() != PaymentStatus.EXPIRED) {
                session.setStatus(PaymentStatus.EXPIRED);
                sessionRepository.save(session);
            }
            throw new SessionExpiredException("Payment session has expired. Please initiate a new payment session.");
        }

        if (session.getStatus() == PaymentStatus.APPROVED ||
            session.getStatus() == PaymentStatus.CONFIRMED ||
            session.getStatus() == PaymentStatus.CANCELLED ||
            session.getStatus() == PaymentStatus.FAILED) {
            throw new InvalidSessionStateException("Session already processed with status " + session.getStatus());
        }

        return session;
    }

    private void checkAndApplyExpiry(PaymentSession session) {
        if (session.getStatus() == PaymentStatus.PENDING && session.isExpired()) {
            session.setStatus(PaymentStatus.EXPIRED);
            sessionRepository.save(session);
        }
    }
}
