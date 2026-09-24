package com.ecommerce.payment_service;

import com.ecommerce.payment_service.config.MaskingMessageConverter;
import com.ecommerce.payment_service.dto.*;
import com.ecommerce.payment_service.model.PaymentRecord;
import com.ecommerce.payment_service.model.PaymentSession;
import com.ecommerce.payment_service.model.PaymentStatus;
import com.ecommerce.payment_service.repository.PaymentRecordRepository;
import com.ecommerce.payment_service.repository.PaymentSessionRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import ch.qos.logback.classic.spi.ILoggingEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.Mockito;
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
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

/**
 * Adversarial Stress & Security Verification Test Harness for payment-service.
 * Authored by Empirical Challenger 1 (Milestone 1).
 */
@SpringBootTest
@AutoConfigureMockMvc
class AdversarialPaymentSecurityAndBoundaryTest {

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

    // =========================================================================
    // 1. BOUNDARY AND INPUT VALIDATION TESTS
    // =========================================================================

    @Nested
    @DisplayName("1. Boundary & Input Validation Tests")
    class BoundaryAndValidationTests {

        @Test
        @DisplayName("POST /session - Reject negative totalAmount")
        void rejectNegativeAmount() throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-NEG-1")
                    .email("buyer@example.com")
                    .totalAmount(new BigDecimal("-150.00"))
                    .currency("ARS")
                    .items(List.of(OrderItemDTO.builder().sku("SKU-1").quantity(1).price(new BigDecimal("100.00")).build()))
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Validation Error")))
                    .andExpect(jsonPath("$.status", is(400)))
                    .andExpect(jsonPath("$.errors.totalAmount", notNullValue()))
                    .andExpect(jsonPath("$.stackTrace").doesNotExist());
        }

        @Test
        @DisplayName("POST /session - Reject zero totalAmount")
        void rejectZeroAmount() throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-ZERO-1")
                    .email("buyer@example.com")
                    .totalAmount(new BigDecimal("0.00"))
                    .currency("ARS")
                    .items(List.of(OrderItemDTO.builder().sku("SKU-1").quantity(1).price(new BigDecimal("10.00")).build()))
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.totalAmount", notNullValue()));
        }

        @Test
        @DisplayName("POST /session - Accept boundary minimum valid amount (0.01 ARS)")
        void acceptMinimumValidAmount() throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-MIN-1")
                    .email("buyer@example.com")
                    .totalAmount(new BigDecimal("0.01"))
                    .currency("ARS")
                    .items(List.of(OrderItemDTO.builder().sku("SKU-1").quantity(1).price(new BigDecimal("0.01")).build()))
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.sessionId", startsWith("sess_")))
                    .andExpect(jsonPath("$.totalAmount", is(0.01)))
                    .andExpect(jsonPath("$.status", is("PENDING")));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "   ", "\t\n"})
        @DisplayName("POST /session - Reject empty or whitespace orderNumber")
        void rejectEmptyOrderNumber(String blankOrder) throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber(blankOrder)
                    .email("buyer@example.com")
                    .totalAmount(new BigDecimal("100.00"))
                    .currency("ARS")
                    .items(List.of(OrderItemDTO.builder().sku("SKU-1").quantity(1).price(new BigDecimal("100.00")).build()))
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.orderNumber", notNullValue()));
        }

        @ParameterizedTest
        @ValueSource(strings = {"", "plainaddress", "@missinguser.com", "missingdomain@", "user@.com"})
        @DisplayName("POST /session - Reject malformed or empty emails")
        void rejectMalformedEmails(String badEmail) throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-EMAIL-1")
                    .email(badEmail)
                    .totalAmount(new BigDecimal("100.00"))
                    .currency("ARS")
                    .items(List.of(OrderItemDTO.builder().sku("SKU-1").quantity(1).price(new BigDecimal("100.00")).build()))
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.email", notNullValue()));
        }

        @Test
        @DisplayName("POST /session - Reject empty items list")
        void rejectEmptyItemsList() throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-NO-ITEMS")
                    .email("buyer@example.com")
                    .totalAmount(new BigDecimal("100.00"))
                    .currency("ARS")
                    .items(List.of())
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.items", notNullValue()));
        }

        @Test
        @DisplayName("POST /session - Reject items with zero or negative quantity or price")
        void rejectInvalidItemParameters() throws Exception {
            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-BAD-ITEM")
                    .email("buyer@example.com")
                    .totalAmount(new BigDecimal("100.00"))
                    .currency("ARS")
                    .items(List.of(
                            OrderItemDTO.builder().sku("").quantity(0).price(new BigDecimal("-5.00")).build()
                    ))
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.status", is(400)))
                    .andExpect(jsonPath("$.errors", notNullValue()));
        }

        @Test
        @DisplayName("POST /session - Handle large payload with 50 items successfully")
        void acceptLargePayload() throws Exception {
            List<OrderItemDTO> items = new ArrayList<>();
            for (int i = 1; i <= 50; i++) {
                items.add(OrderItemDTO.builder()
                        .sku("SKU-" + i)
                        .quantity(i)
                        .price(new BigDecimal("10.00"))
                        .build());
            }

            PaymentSessionRequest request = PaymentSessionRequest.builder()
                    .orderNumber("ORD-STRESS-ITEMS")
                    .email("stress.buyer@example.com")
                    .totalAmount(new BigDecimal("12750.00"))
                    .currency("ARS")
                    .items(items)
                    .build();

            mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isCreated())
                    .andExpect(jsonPath("$.sessionId", notNullValue()))
                    .andExpect(jsonPath("$.totalAmount", is(12750.00)));
        }

        @Test
        @DisplayName("GET /session/{sessionId} - Return 404 for invalid or non-existent session ID")
        void return404ForUnknownSessionId() throws Exception {
            mockMvc.perform(get("/api/v1/payment/session/sess_nonexistent_999999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title", is("Resource Not Found")))
                    .andExpect(jsonPath("$.status", is(404)))
                    .andExpect(jsonPath("$.resource", is("PaymentSession")))
                    .andExpect(jsonPath("$.field", is("sessionId")))
                    .andExpect(jsonPath("$.stackTrace").doesNotExist());
        }

        @Test
        @DisplayName("GET /status/{orderNumber} - Return 404 for non-existent order number")
        void return404ForUnknownOrderNumber() throws Exception {
            mockMvc.perform(get("/api/v1/payment/status/ORD-NONEXISTENT-9999"))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title", is("Resource Not Found")))
                    .andExpect(jsonPath("$.status", is(404)))
                    .andExpect(jsonPath("$.field", is("orderNumber")));
        }
    }

    // =========================================================================
    // 2. SECURITY PROBES: REJECTION OF RAW CARD DATA & NO PAN ECHO
    // =========================================================================

    @Nested
    @DisplayName("2. Security Probes: Sensitive Card Data Rejection & Zero PAN Leakage")
    class SecurityProbesTests {

        private PaymentSession createActiveSession() {
            return sessionRepository.save(PaymentSession.builder()
                    .sessionId("sess_sec_probe_" + System.currentTimeMillis())
                    .orderNumber("ORD-SEC-001")
                    .email("security.tester@example.com")
                    .totalAmount(new BigDecimal("5000.00"))
                    .currency("ARS")
                    .status(PaymentStatus.PENDING)
                    .createdAt(Instant.now())
                    .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                    .build());
        }

        @Test
        @DisplayName("POST /process - Security probe: reject payload containing raw cardNumber and assert zero PAN echo")
        void rejectPayloadWithCardNumberAndVerifyNoEcho() throws Exception {
            PaymentSession session = createActiveSession();
            String rawCard = "4532015698741234";

            String payload = String.format("""
                    {
                        "sessionId": "%s",
                        "token": "valid_mock_token",
                        "paymentMethodId": "visa",
                        "installments": 1,
                        "payerEmail": "security.tester@example.com",
                        "cardNumber": "%s"
                    }
                    """, session.getSessionId(), rawCard);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Invalid Request Payload")))
                    .andExpect(jsonPath("$.status", is(400)))
                    .andExpect(jsonPath("$.stackTrace").doesNotExist())
                    .andReturn();

            String responseBody = result.getResponse().getContentAsString();
            assertFalse(responseBody.contains(rawCard), "Response body MUST NOT echo the raw card PAN!");
            assertFalse(responseBody.contains("UnrecognizedPropertyException"), "Response body must not leak Jackson internal classes!");
        }

        @Test
        @DisplayName("POST /process - Security probe: reject payload containing 'pan' field")
        void rejectPayloadWithPan() throws Exception {
            PaymentSession session = createActiveSession();
            String rawPan = "5424180123456789";

            String payload = String.format("""
                    {
                        "sessionId": "%s",
                        "token": "valid_mock_token",
                        "paymentMethodId": "mastercard",
                        "installments": 1,
                        "payerEmail": "security.tester@example.com",
                        "pan": "%s"
                    }
                    """, session.getSessionId(), rawPan);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            assertFalse(result.getResponse().getContentAsString().contains(rawPan));
        }

        @Test
        @DisplayName("POST /process - Security probe: reject payload containing raw 'cvv'")
        void rejectPayloadWithCvv() throws Exception {
            PaymentSession session = createActiveSession();
            String cvv = "987";

            String payload = String.format("""
                    {
                        "sessionId": "%s",
                        "token": "valid_mock_token",
                        "paymentMethodId": "visa",
                        "installments": 1,
                        "payerEmail": "security.tester@example.com",
                        "cvv": "%s"
                    }
                    """, session.getSessionId(), cvv);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            assertFalse(result.getResponse().getContentAsString().contains(cvv));
        }

        @Test
        @DisplayName("POST /process - Security probe: reject payload containing 'securityCode'")
        void rejectPayloadWithSecurityCode() throws Exception {
            PaymentSession session = createActiveSession();
            String secCode = "456";

            String payload = String.format("""
                    {
                        "sessionId": "%s",
                        "token": "valid_mock_token",
                        "paymentMethodId": "visa",
                        "installments": 1,
                        "payerEmail": "security.tester@example.com",
                        "securityCode": "%s"
                    }
                    """, session.getSessionId(), secCode);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            assertFalse(result.getResponse().getContentAsString().contains(secCode));
        }

        @Test
        @DisplayName("POST /process - Security probe: reject full raw card bundle (PAN, CVV, expMonth, expYear)")
        void rejectFullRawCardBundle() throws Exception {
            PaymentSession session = createActiveSession();
            String pan = "4012888888881881";
            String cvv = "321";

            String payload = String.format("""
                    {
                        "sessionId": "%s",
                        "token": "valid_mock_token",
                        "paymentMethodId": "visa",
                        "installments": 1,
                        "payerEmail": "security.tester@example.com",
                        "cardNumber": "%s",
                        "cvv": "%s",
                        "expirationMonth": 12,
                        "expirationYear": 2028,
                        "cardholderName": "HACKER TEST"
                    }
                    """, session.getSessionId(), pan, cvv);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.title", is("Invalid Request Payload")))
                    .andReturn();

            String response = result.getResponse().getContentAsString();
            JsonNode root = objectMapper.readTree(response);
            assertFalse(root.path("detail").asText().contains(pan), "PAN leaked in error detail");
            assertFalse(root.path("detail").asText().contains(cvv), "CVV leaked in error detail");
            assertFalse(root.path("detail").asText().contains("HACKER TEST"), "Cardholder name leaked in error detail");
            assertFalse(root.has("cardNumber"), "cardNumber field echoed in response");
            assertFalse(root.has("cvv"), "cvv field echoed in response");
        }

        @Test
        @DisplayName("POST /session - Security probe: reject raw card injected into session creation")
        void rejectRawCardInSessionCreation() throws Exception {
            String pan = "4532015698741234";
            String payload = String.format("""
                    {
                        "orderNumber": "ORD-INJECT-1",
                        "email": "injected@example.com",
                        "totalAmount": 1000.00,
                        "currency": "ARS",
                        "items": [{"sku": "SKU-1", "quantity": 1, "price": 1000.00}],
                        "cardNumber": "%s"
                    }
                    """, pan);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/session")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            assertFalse(result.getResponse().getContentAsString().contains(pan));
        }

        @Test
        @DisplayName("POST /bank-transfer/confirm - Security probe: reject raw card injected into bank transfer")
        void rejectRawCardInBankTransferConfirm() throws Exception {
            PaymentSession session = createActiveSession();
            String pan = "4532015698741234";
            String payload = String.format("""
                    {
                        "sessionId": "%s",
                        "voucherNumber": "V-1234",
                        "cardNumber": "%s",
                        "cvv": "999"
                    }
                    """, session.getSessionId(), pan);

            MvcResult result = mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(payload))
                    .andExpect(status().isBadRequest())
                    .andReturn();

            assertFalse(result.getResponse().getContentAsString().contains(pan));
            assertFalse(result.getResponse().getContentAsString().contains("999"));
        }

        @Test
        @DisplayName("Log Masking Converter - Mask multi-brand PANs, CVV, expiry and tokens")
        void verifyLogMaskingCoverage() {
            MaskingMessageConverter converter = new MaskingMessageConverter();

            // Visa 16 digits
            ILoggingEvent visaEvent = mockLogEvent("Card 4532015698741234 processed");
            String maskedVisa = converter.convert(visaEvent);
            assertFalse(maskedVisa.contains("4532015698741234"));
            assertTrue(maskedVisa.contains("************1234"));

            // Mastercard 16 digits
            ILoggingEvent mcEvent = mockLogEvent("Mastercard: 5424180123456789");
            String maskedMc = converter.convert(mcEvent);
            assertFalse(maskedMc.contains("5424180123456789"));
            assertTrue(maskedMc.contains("************6789"));

            // Amex 15 digits
            ILoggingEvent amexEvent = mockLogEvent("Amex: 378282246310005");
            String maskedAmex = converter.convert(amexEvent);
            assertFalse(maskedAmex.contains("378282246310005"));
            assertTrue(maskedAmex.contains("************0005"));

            // CVV with security_code keyword
            ILoggingEvent cvvEvent = mockLogEvent("Payload security_code=789");
            String maskedCvv = converter.convert(cvvEvent);
            assertFalse(maskedCvv.contains("789"));
            assertTrue(maskedCvv.contains("security_code=***"));

            // Expiry (matches expiry or expiration_date and replaces with $1=**/**)
            ILoggingEvent expEvent = mockLogEvent("expiry: 11/29");
            String maskedExp = converter.convert(expEvent);
            assertFalse(maskedExp.contains("11/29"));
            assertTrue(maskedExp.contains("expiry=**/**"));

            // MP Access Token
            ILoggingEvent mpEvent = mockLogEvent("Token TEST-1234567890-098765-abcdef123456");
            String maskedMp = converter.convert(mpEvent);
            assertFalse(maskedMp.contains("abcdef123456"));
            assertTrue(maskedMp.contains("TEST-****-PROTECTED"));
        }

        private ILoggingEvent mockLogEvent(String message) {
            ILoggingEvent event = Mockito.mock(ILoggingEvent.class);
            when(event.getFormattedMessage()).thenReturn(message);
            return event;
        }
    }

    // =========================================================================
    // 3. EXPIRATION TESTS (10-MINUTE TTL & HTTP 410 GONE)
    // =========================================================================

    @Nested
    @DisplayName("3. Expiration Tests: Past Expiry, HTTP 410 Gone & Status Transition")
    class ExpirationTests {

        private PaymentSession createExpiredSession(String sessionId, String orderNumber) {
            return sessionRepository.save(PaymentSession.builder()
                    .sessionId(sessionId)
                    .orderNumber(orderNumber)
                    .email("expired.user@example.com")
                    .totalAmount(new BigDecimal("3500.00"))
                    .currency("ARS")
                    .status(PaymentStatus.PENDING)
                    .createdAt(Instant.now().minus(Duration.ofMinutes(15)))
                    .expiresAt(Instant.now().minus(Duration.ofMinutes(5)))
                    .build());
        }

        @Test
        @DisplayName("POST /process - Return HTTP 410 GONE when card payment is attempted on expired session")
        void return410OnCardPaymentWithExpiredSession() throws Exception {
            PaymentSession expiredSession = createExpiredSession("sess_exp_card_1", "ORD-EXP-001");

            CardPaymentRequest request = CardPaymentRequest.builder()
                    .sessionId(expiredSession.getSessionId())
                    .token("mock_token_approved")
                    .paymentMethodId("visa")
                    .installments(1)
                    .payerEmail("expired.user@example.com")
                    .build();

            mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isGone())
                    .andExpect(jsonPath("$.title", is("Payment Session Expired")))
                    .andExpect(jsonPath("$.status", is(410)))
                    .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/session-expired")))
                    .andExpect(jsonPath("$.stackTrace").doesNotExist());

            // Empirical Finding: Transaction rolls back on unchecked SessionExpiredException,
            // so session in database remains PENDING rather than committing EXPIRED.
            PaymentSession updated = sessionRepository.findBySessionId(expiredSession.getSessionId()).orElseThrow();
            assertNotNull(updated);
            assertEquals(PaymentStatus.EXPIRED, updated.getStatus());
        }

        @Test
        @DisplayName("POST /bank-transfer/confirm - Return HTTP 410 GONE when bank transfer confirm is attempted on expired session")
        void return410OnBankTransferWithExpiredSession() throws Exception {
            PaymentSession expiredSession = createExpiredSession("sess_exp_bt_1", "ORD-EXP-002");

            BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                    .sessionId(expiredSession.getSessionId())
                    .voucherNumber("V-EXP-99")
                    .build();

            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isGone())
                    .andExpect(jsonPath("$.title", is("Payment Session Expired")))
                    .andExpect(jsonPath("$.status", is(410)))
                    .andExpect(jsonPath("$.type", is("https://api.ecommerce.com/errors/session-expired")));

            PaymentSession updated = sessionRepository.findBySessionId(expiredSession.getSessionId()).orElseThrow();
            assertNotNull(updated);
            assertEquals(PaymentStatus.EXPIRED, updated.getStatus());
        }

        @Test
        @DisplayName("GET /session/{sessionId} - Return status EXPIRED and 0 remaining seconds for expired session")
        void returnExpiredStatusOnQueryBySessionId() throws Exception {
            PaymentSession expiredSession = createExpiredSession("sess_exp_query_1", "ORD-EXP-003");

            mockMvc.perform(get("/api/v1/payment/session/" + expiredSession.getSessionId()))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.sessionId", is("sess_exp_query_1")))
                    .andExpect(jsonPath("$.status", is("EXPIRED")))
                    .andExpect(jsonPath("$.remainingSeconds", is(0)));
        }

        @Test
        @DisplayName("GET /status/{orderNumber} - Return status EXPIRED for expired session")
        void returnExpiredStatusOnQueryByOrderNumber() throws Exception {
            createExpiredSession("sess_exp_query_2", "ORD-EXP-004");

            mockMvc.perform(get("/api/v1/payment/status/ORD-EXP-004"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.orderNumber", is("ORD-EXP-004")))
                    .andExpect(jsonPath("$.status", is("EXPIRED")))
                    .andExpect(jsonPath("$.remainingSeconds", is(0)));
        }
    }

    // =========================================================================
    // 4. BANK TRANSFER FLOW, IDEMPOTENCY & DEMO DETAILS
    // =========================================================================

    @Nested
    @DisplayName("4. Bank Transfer Flow, Idempotency & Argentine Demo Details")
    class BankTransferTests {

        @Test
        @DisplayName("GET /bank-transfer/details - Return authentic fictitious Argentine bank details")
        void getDemoBankDetails() throws Exception {
            mockMvc.perform(get("/api/v1/payment/bank-transfer/details"))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.cbu", is(BankDetailsDTO.DEMO_CBU)))
                    .andExpect(jsonPath("$.cbu", hasLength(22)))
                    .andExpect(jsonPath("$.cuil", is(BankDetailsDTO.DEMO_CUIL)))
                    .andExpect(jsonPath("$.titular", is(BankDetailsDTO.DEMO_TITULAR)))
                    .andExpect(jsonPath("$.alias", is(BankDetailsDTO.DEMO_ALIAS)))
                    .andExpect(jsonPath("$.bank", is(BankDetailsDTO.DEMO_BANK)));
        }

        @Test
        @DisplayName("POST /bank-transfer/confirm - Confirm active session and ensure strict idempotency on repeated calls")
        void confirmBankTransferAndVerifyStrictIdempotency() throws Exception {
            PaymentSession session = sessionRepository.save(PaymentSession.builder()
                    .sessionId("sess_bt_idemp_test")
                    .orderNumber("ORD-BT-777")
                    .email("transfer.test@example.com")
                    .totalAmount(new BigDecimal("8500.00"))
                    .currency("ARS")
                    .status(PaymentStatus.PENDING)
                    .createdAt(Instant.now())
                    .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                    .build());

            BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                    .sessionId(session.getSessionId())
                    .voucherNumber("V-TRANS-01")
                    .build();

            // 1st call: Initial confirmation
            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("CONFIRMED")))
                    .andExpect(jsonPath("$.orderNumber", is("ORD-BT-777")))
                    .andExpect(jsonPath("$.paymentMethod", is("BANK_TRANSFER")))
                    .andExpect(jsonPath("$.bankDetails.cbu", is(BankDetailsDTO.DEMO_CBU)));

            List<PaymentRecord> initialRecords = recordRepository.findBySessionId(session.getSessionId());
            assertEquals(1, initialRecords.size(), "Should have exactly 1 payment record inserted");

            // 2nd call: Repeated identical request (Idempotency check)
            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("CONFIRMED")))
                    .andExpect(jsonPath("$.message", containsString("already confirmed")));

            List<PaymentRecord> secondRecords = recordRepository.findBySessionId(session.getSessionId());
            assertEquals(1, secondRecords.size(), "Record count MUST remain 1 after repeated confirmation");

            // 3rd call: Another repeated request
            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isOk())
                    .andExpect(jsonPath("$.status", is("CONFIRMED")));

            List<PaymentRecord> thirdRecords = recordRepository.findBySessionId(session.getSessionId());
            assertEquals(1, thirdRecords.size(), "Record count MUST remain strictly 1");
        }

        @Test
        @DisplayName("POST /bank-transfer/confirm - Reject empty sessionId with 400 Bad Request")
        void rejectEmptySessionId() throws Exception {
            BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                    .sessionId("")
                    .build();

            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.sessionId", notNullValue()));
        }

        @Test
        @DisplayName("POST /bank-transfer/confirm - Return 404 for non-existent session ID")
        void return404ForNonExistentSession() throws Exception {
            BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                    .sessionId("sess_does_not_exist_bt")
                    .build();

            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isNotFound())
                    .andExpect(jsonPath("$.title", is("Resource Not Found")));
        }
    }

    // =========================================================================
    // 5. LIFECYCLE & CONFLICTING STATE TRANSITIONS
    // =========================================================================

    @Nested
    @DisplayName("5. Lifecycle & Conflicting State Transitions")
    class LifecycleStateTransitionTests {

        @Test
        @DisplayName("POST /process - Reject card payment attempt on already APPROVED session (HTTP 409 Conflict)")
        void rejectCardPaymentOnAlreadyApprovedSession() throws Exception {
            PaymentSession session = sessionRepository.save(PaymentSession.builder()
                    .sessionId("sess_already_approved")
                    .orderNumber("ORD-APPROVED-1")
                    .email("approved@example.com")
                    .totalAmount(new BigDecimal("5000.00"))
                    .currency("ARS")
                    .status(PaymentStatus.APPROVED)
                    .createdAt(Instant.now())
                    .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                    .build());

            CardPaymentRequest request = CardPaymentRequest.builder()
                    .sessionId(session.getSessionId())
                    .token("mock_token_approved")
                    .paymentMethodId("visa")
                    .installments(1)
                    .payerEmail("approved@example.com")
                    .build();

            mockMvc.perform(post("/api/v1/payment/process")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.title", is("Invalid Session State")))
                    .andExpect(jsonPath("$.status", is(409)))
                    .andExpect(jsonPath("$.stackTrace").doesNotExist());
        }

        @Test
        @DisplayName("POST /bank-transfer/confirm - Reject bank transfer confirm on already APPROVED session (HTTP 409 Conflict)")
        void rejectBankTransferOnAlreadyApprovedSession() throws Exception {
            PaymentSession session = sessionRepository.save(PaymentSession.builder()
                    .sessionId("sess_already_approved_bt")
                    .orderNumber("ORD-APPROVED-2")
                    .email("approved2@example.com")
                    .totalAmount(new BigDecimal("6000.00"))
                    .currency("ARS")
                    .status(PaymentStatus.APPROVED)
                    .createdAt(Instant.now())
                    .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                    .build());

            BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                    .sessionId(session.getSessionId())
                    .voucherNumber("V-001")
                    .build();

            mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(objectMapper.writeValueAsString(request)))
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.title", is("Invalid Session State")))
                    .andExpect(jsonPath("$.status", is(409)));
        }
    }
}
