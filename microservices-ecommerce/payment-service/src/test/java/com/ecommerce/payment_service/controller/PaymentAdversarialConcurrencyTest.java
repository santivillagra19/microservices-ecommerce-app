package com.ecommerce.payment_service.controller;

import com.ecommerce.payment_service.dto.BankTransferConfirmRequest;
import com.ecommerce.payment_service.dto.CardPaymentRequest;
import com.ecommerce.payment_service.model.PaymentRecord;
import com.ecommerce.payment_service.model.PaymentSession;
import com.ecommerce.payment_service.model.PaymentStatus;
import com.ecommerce.payment_service.repository.PaymentRecordRepository;
import com.ecommerce.payment_service.repository.PaymentSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.*;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class PaymentAdversarialConcurrencyTest {

    private static final MediaType ACTUATOR_V3_JSON = MediaType.valueOf("application/vnd.spring-boot.actuator.v3+json");

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentSessionRepository sessionRepository;

    @Autowired
    private PaymentRecordRepository recordRepository;

    @BeforeEach
    void cleanDatabase() {
        recordRepository.deleteAll();
        sessionRepository.deleteAll();
    }

    private PaymentSession createTestSession(String sessionId, String orderNumber, PaymentStatus status) {
        return sessionRepository.save(PaymentSession.builder()
                .sessionId(sessionId)
                .orderNumber(orderNumber)
                .email("test.challenger@example.com")
                .totalAmount(new BigDecimal("9999.00"))
                .currency("ARS")
                .status(status)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build());
    }

    // =========================================================================
    // 1. REPEATED BANK TRANSFER CONFIRMATIONS (IDEMPOTENCY & CONCURRENCY)
    // =========================================================================

    @Test
    @DisplayName("Idempotency: Repeated sequential bank transfer confirmations return existing confirmation without duplicates")
    void shouldBeIdempotentOnRepeatedBankTransferConfirmation() throws Exception {
        String sessionId = "sess_adv_bt_seq";
        createTestSession(sessionId, "ORD-BT-SEQ", PaymentStatus.PENDING);

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId(sessionId)
                .voucherNumber("VOUCHER-001")
                .build();

        // Call 1: Confirm session
        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.orderNumber", is("ORD-BT-SEQ")))
                .andExpect(jsonPath("$.paymentId", notNullValue()))
                .andExpect(jsonPath("$.message", is("Bank transfer confirmed successfully")));

        List<PaymentRecord> recordsAfterFirst = recordRepository.findBySessionId(sessionId);
        assertEquals(1, recordsAfterFirst.size(), "Exactly 1 payment record should exist after first confirmation");

        // Call 2: Confirm again
        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.orderNumber", is("ORD-BT-SEQ")))
                .andExpect(jsonPath("$.message", is("Bank transfer already confirmed")));

        List<PaymentRecord> recordsAfterSecond = recordRepository.findBySessionId(sessionId);
        assertEquals(1, recordsAfterSecond.size(), "Still exactly 1 payment record must exist after repeated confirmation");

        // Call 3: Confirm a third time
        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.message", is("Bank transfer already confirmed")));

        assertEquals(1, recordRepository.findBySessionId(sessionId).size());
    }

    @Test
    @DisplayName("Concurrency: Concurrent bank transfer confirmations for same session")
    void shouldHandleConcurrentBankTransferConfirmations() throws Exception {
        String sessionId = "sess_adv_bt_conc";
        createTestSession(sessionId, "ORD-BT-CONC", PaymentStatus.PENDING);

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId(sessionId)
                .voucherNumber("VOUCHER-CONC")
                .build();

        String payload = objectMapper.writeValueAsString(request);
        int threadCount = 10;
        ExecutorService executor = Executors.newFixedThreadPool(threadCount);
        CountDownLatch startLatch = new CountDownLatch(1);
        CountDownLatch doneLatch = new CountDownLatch(threadCount);

        List<Integer> statusCodes = Collections.synchronizedList(new ArrayList<>());

        for (int i = 0; i < threadCount; i++) {
            executor.submit(() -> {
                try {
                    startLatch.await();
                    MvcResult result = mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                                    .contentType(MediaType.APPLICATION_JSON)
                                    .content(payload))
                            .andReturn();
                    statusCodes.add(result.getResponse().getStatus());
                } catch (Exception e) {
                    statusCodes.add(500);
                } finally {
                    doneLatch.countDown();
                }
            });
        }

        startLatch.countDown();
        assertTrue(doneLatch.await(15, TimeUnit.SECONDS), "Concurrent requests did not complete in time");
        executor.shutdown();

        assertEquals(threadCount, statusCodes.size());
        for (int code : statusCodes) {
            assertEquals(200, code, "All concurrent bank transfer confirmations should return HTTP 200");
        }

        PaymentSession session = sessionRepository.findBySessionId(sessionId).orElseThrow();
        assertEquals(PaymentStatus.CONFIRMED, session.getStatus());

        List<PaymentRecord> records = recordRepository.findBySessionId(sessionId);
        System.out.println("Payment records created under 10 concurrent requests: " + records.size());
        assertEquals(1, records.size(), "Exactly 1 payment record must exist despite concurrent execution");
    }

    // =========================================================================
    // 2. REPEATED PAYMENTS ON ALREADY APPROVED SESSIONS
    // =========================================================================

    @Test
    @DisplayName("Conflict: Card payment on already APPROVED session returns 409 CONFLICT")
    void shouldReturn409WhenProcessingCardPaymentOnAlreadyApprovedSession() throws Exception {
        String sessionId = "sess_adv_card_approved";
        createTestSession(sessionId, "ORD-ALREADY-APP", PaymentStatus.APPROVED);

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId(sessionId)
                .token("mock_token_approved")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("card.buyer@example.com")
                .build();

        mockMvc.perform(post("/api/v1/payment/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title", is("Invalid Session State")))
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/invalid-state")))
                .andExpect(jsonPath("$.detail", containsString("Session already processed with status APPROVED")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("Conflict: Bank transfer confirmation on already APPROVED session returns 409 CONFLICT")
    void shouldReturn409WhenConfirmingBankTransferOnAlreadyApprovedSession() throws Exception {
        String sessionId = "sess_adv_bt_approved";
        createTestSession(sessionId, "ORD-BT-APP", PaymentStatus.APPROVED);

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId(sessionId)
                .voucherNumber("VOUCHER-ON-APP")
                .build();

        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title", is("Invalid Session State")))
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/invalid-state")))
                .andExpect(jsonPath("$.detail", containsString("Session already processed with status APPROVED")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("State Transition: Card payment on already CONFIRMED session returns 409 CONFLICT")
    void shouldRejectCardPaymentOnAlreadyConfirmedSession() throws Exception {
        String sessionId = "sess_adv_card_confirmed";
        createTestSession(sessionId, "ORD-ALREADY-CONF", PaymentStatus.CONFIRMED);

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId(sessionId)
                .token("mock_token_approved")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("card.buyer@example.com")
                .build();

        mockMvc.perform(post("/api/v1/payment/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.title", is("Invalid Session State")))
                .andExpect(jsonPath("$.status", is(409)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/invalid-state")))
                .andExpect(jsonPath("$.detail", containsString("CONFIRMED")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    // =========================================================================
    // 3. SESSION LOOKUP BY NON-EXISTENT SESSION ID / ORDER ID & NON-EXISTENT IN PROCESS
    // =========================================================================

    @Test
    @DisplayName("404 Not Found: Query session by non-existent session ID")
    void shouldReturn404ForNonExistentSessionId() throws Exception {
        String nonExistentId = "sess_non_existent_" + UUID.randomUUID();

        mockMvc.perform(get("/api/v1/payment/session/" + nonExistentId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Resource Not Found")))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/not-found")))
                .andExpect(jsonPath("$.resource", is("PaymentSession")))
                .andExpect(jsonPath("$.field", is("sessionId")))
                .andExpect(jsonPath("$.detail", containsString(nonExistentId)))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("404 Not Found: Query payment status by non-existent orderNumber")
    void shouldReturn404ForNonExistentOrderNumber() throws Exception {
        String nonExistentOrder = "ORD-GHOST-" + UUID.randomUUID();

        mockMvc.perform(get("/api/v1/payment/status/" + nonExistentOrder))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Resource Not Found")))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/not-found")))
                .andExpect(jsonPath("$.resource", is("PaymentSession")))
                .andExpect(jsonPath("$.field", is("orderNumber")))
                .andExpect(jsonPath("$.detail", containsString(nonExistentOrder)))
                .andExpect(jsonPath("$.timestamp", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("404 Not Found: Processing card payment with non-existent session ID returns 404")
    void shouldReturn404WhenProcessingCardPaymentWithNonExistentSession() throws Exception {
        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId("sess_ghost_card")
                .token("mock_token_approved")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("card.buyer@example.com")
                .build();

        mockMvc.perform(post("/api/v1/payment/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Resource Not Found")))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.field", is("sessionId")));
    }

    @Test
    @DisplayName("404 Not Found: Confirming bank transfer with non-existent session ID returns 404")
    void shouldReturn404WhenConfirmingBankTransferWithNonExistentSession() throws Exception {
        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId("sess_ghost_bt")
                .voucherNumber("V-GHOST")
                .build();

        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.title", is("Resource Not Found")))
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.field", is("sessionId")));
    }

    // =========================================================================
    // 4. ACTUATOR HEALTH PROBES FORMAT AND RESPONSE CODES
    // =========================================================================

    @Test
    @DisplayName("Actuator: /actuator/health returns 200 and UP status")
    void shouldReturnActuatorHealth() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(ACTUATOR_V3_JSON))
                .andExpect(jsonPath("$.status", is("UP")))
                .andExpect(jsonPath("$.components", notNullValue()))
                .andExpect(jsonPath("$.components.db.status", is("UP")));
    }

    @Test
    @DisplayName("Actuator Probes: /actuator/health/liveness returns 200 and UP status")
    void shouldReturnLivenessProbe() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(ACTUATOR_V3_JSON))
                .andExpect(jsonPath("$.status", is("UP")));
    }

    @Test
    @DisplayName("Actuator Probes: /actuator/health/readiness returns 200 and UP status")
    void shouldReturnReadinessProbe() throws Exception {
        mockMvc.perform(get("/actuator/health/readiness"))
                .andExpect(status().isOk())
                .andExpect(content().contentTypeCompatibleWith(ACTUATOR_V3_JSON))
                .andExpect(jsonPath("$.status", is("UP")));
    }

    // =========================================================================
    // 5. EXPIRED SESSIONS BEHAVIOR
    // =========================================================================

    @Test
    @DisplayName("Expired: Querying expired session dynamically reports status EXPIRED and remainingSeconds = 0")
    void shouldReportSessionExpiredOnQuery() throws Exception {
        PaymentSession expiredSession = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_adv_expired_query")
                .orderNumber("ORD-EXP-QUERY")
                .email("expired.query@example.com")
                .totalAmount(new BigDecimal("1000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now().minus(Duration.ofMinutes(20)))
                .expiresAt(Instant.now().minus(Duration.ofMinutes(10)))
                .build());

        mockMvc.perform(get("/api/v1/payment/session/" + expiredSession.getSessionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is("sess_adv_expired_query")))
                .andExpect(jsonPath("$.status", is("EXPIRED")))
                .andExpect(jsonPath("$.remainingSeconds", is(0)));
    }

    @Test
    @DisplayName("Expired: Bank transfer confirmation on expired session returns 410 GONE")
    void shouldReturn410OnExpiredBankTransferConfirmation() throws Exception {
        PaymentSession expiredSession = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_adv_expired_bt")
                .orderNumber("ORD-EXP-BT")
                .email("expired.bt@example.com")
                .totalAmount(new BigDecimal("1000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now().minus(Duration.ofMinutes(20)))
                .expiresAt(Instant.now().minus(Duration.ofMinutes(10)))
                .build());

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId(expiredSession.getSessionId())
                .voucherNumber("VOUCHER-EXP")
                .build();

        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.title", is("Payment Session Expired")))
                .andExpect(jsonPath("$.status", is(410)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/session-expired")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("Expired: Card payment process on expired session returns 410 GONE")
    void shouldReturn410OnExpiredCardPayment() throws Exception {
        PaymentSession expiredSession = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_adv_expired_card")
                .orderNumber("ORD-EXP-CARD")
                .email("expired.card@example.com")
                .totalAmount(new BigDecimal("1000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now().minus(Duration.ofMinutes(20)))
                .expiresAt(Instant.now().minus(Duration.ofMinutes(10)))
                .build());

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId(expiredSession.getSessionId())
                .token("mock_token_approved")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("card.buyer@example.com")
                .build();

        mockMvc.perform(post("/api/v1/payment/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isGone())
                .andExpect(jsonPath("$.title", is("Payment Session Expired")))
                .andExpect(jsonPath("$.status", is(410)))
                .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/session-expired")))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }
}
