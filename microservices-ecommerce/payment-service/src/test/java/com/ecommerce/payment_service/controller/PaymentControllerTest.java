package com.ecommerce.payment_service.controller;

import com.ecommerce.payment_service.dto.*;
import com.ecommerce.payment_service.model.PaymentSession;
import com.ecommerce.payment_service.model.PaymentStatus;
import com.ecommerce.payment_service.repository.PaymentSessionRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class PaymentControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private PaymentSessionRepository sessionRepository;

    @BeforeEach
    void setUp() {
        sessionRepository.deleteAll();
    }

    @Test
    @DisplayName("POST /api/v1/payment/session - should create payment session successfully")
    void shouldCreateSessionSuccessfully() throws Exception {
        PaymentSessionRequest request = PaymentSessionRequest.builder()
                .orderNumber("ORD-2001")
                .email("guest.buyer@example.com")
                .totalAmount(new BigDecimal("15000.00"))
                .currency("ARS")
                .items(List.of(
                        OrderItemDTO.builder()
                                .sku("SKU-PROD-1")
                                .quantity(2)
                                .price(new BigDecimal("7500.00"))
                                .build()
                ))
                .build();

        mockMvc.perform(post("/api/v1/payment/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.sessionId", notNullValue()))
                .andExpect(jsonPath("$.orderNumber", is("ORD-2001")))
                .andExpect(jsonPath("$.email", is("guest.buyer@example.com")))
                .andExpect(jsonPath("$.totalAmount", is(15000.00)))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.expiresAt", notNullValue()))
                .andExpect(jsonPath("$.remainingSeconds", greaterThan(500)));
    }

    @Test
    @DisplayName("POST /api/v1/payment/session - should return 400 when validation fails")
    void shouldRejectInvalidSessionCreation() throws Exception {
        PaymentSessionRequest invalidRequest = PaymentSessionRequest.builder()
                .orderNumber("") // blank orderNumber
                .email("not-an-email")
                .totalAmount(new BigDecimal("-100.00")) // negative amount
                .build();

        mockMvc.perform(post("/api/v1/payment/session")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Validation Error")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.errors", notNullValue()))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/payment/process - should process card payment via token")
    void shouldProcessCardPaymentSuccessfully() throws Exception {
        PaymentSession session = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_card_test")
                .orderNumber("ORD-2002")
                .email("card.buyer@example.com")
                .totalAmount(new BigDecimal("5000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build());

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId(session.getSessionId())
                .token("mock_token_approved")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("card.buyer@example.com")
                .build();

        mockMvc.perform(post("/api/v1/payment/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("APPROVED")))
                .andExpect(jsonPath("$.paymentId", notNullValue()))
                .andExpect(jsonPath("$.orderNumber", is("ORD-2002")))
                .andExpect(jsonPath("$.paymentMethod", is("MERCADOPAGO")));
    }

    @Test
    @DisplayName("POST /api/v1/payment/process - security: should reject requests containing card PAN or CVV")
    void shouldRejectRawCardDataWithUnknownProperties() throws Exception {
        String payloadWithCardData = """
                {
                    "sessionId": "sess_card_test",
                    "token": "some_token",
                    "paymentMethodId": "visa",
                    "installments": 1,
                    "payerEmail": "card.buyer@example.com",
                    "cardNumber": "4532015698741234",
                    "cvv": "123"
                }
                """;

        mockMvc.perform(post("/api/v1/payment/process")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payloadWithCardData))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.title", is("Invalid Request Payload")))
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.stackTrace").doesNotExist());
    }

    @Test
    @DisplayName("POST /api/v1/payment/process - should return 410 GONE when session has expired")
    void shouldReturn410WhenSessionExpired() throws Exception {
        PaymentSession expired = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_expired_test")
                .orderNumber("ORD-EXPIRED-1")
                .email("card.buyer@example.com")
                .totalAmount(new BigDecimal("5000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now().minus(Duration.ofMinutes(15)))
                .expiresAt(Instant.now().minus(Duration.ofMinutes(5)))
                .build());

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId(expired.getSessionId())
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

    @Test
    @DisplayName("POST /api/v1/payment/bank-transfer/confirm - should confirm bank transfer")
    void shouldConfirmBankTransferSuccessfully() throws Exception {
        PaymentSession session = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_transfer_test")
                .orderNumber("ORD-3001")
                .email("transfer.buyer@example.com")
                .totalAmount(new BigDecimal("8000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build());

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId(session.getSessionId())
                .voucherNumber("VOUCHER-9988")
                .build();

        mockMvc.perform(post("/api/v1/payment/bank-transfer/confirm")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CONFIRMED")))
                .andExpect(jsonPath("$.orderNumber", is("ORD-3001")))
                .andExpect(jsonPath("$.paymentMethod", is("BANK_TRANSFER")))
                .andExpect(jsonPath("$.bankDetails.cbu", is(BankDetailsDTO.DEMO_CBU)))
                .andExpect(jsonPath("$.bankDetails.cuil", is(BankDetailsDTO.DEMO_CUIL)))
                .andExpect(jsonPath("$.bankDetails.titular", is(BankDetailsDTO.DEMO_TITULAR)));
    }

    @Test
    @DisplayName("GET /api/v1/payment/bank-transfer/details - should return demo bank details")
    void shouldGetBankTransferDetails() throws Exception {
        mockMvc.perform(get("/api/v1/payment/bank-transfer/details"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.cbu", is(BankDetailsDTO.DEMO_CBU)))
                .andExpect(jsonPath("$.cuil", is(BankDetailsDTO.DEMO_CUIL)))
                .andExpect(jsonPath("$.titular", is(BankDetailsDTO.DEMO_TITULAR)))
                .andExpect(jsonPath("$.alias", is(BankDetailsDTO.DEMO_ALIAS)));
    }

    @Test
    @DisplayName("GET /api/v1/payment/session/{sessionId} - should query status by sessionId")
    void shouldGetStatusBySessionId() throws Exception {
        PaymentSession session = sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_query_test")
                .orderNumber("ORD-4001")
                .email("query.buyer@example.com")
                .totalAmount(new BigDecimal("4500.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build());

        mockMvc.perform(get("/api/v1/payment/session/" + session.getSessionId()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is("sess_query_test")))
                .andExpect(jsonPath("$.orderNumber", is("ORD-4001")))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.amount", is(4500.00)));
    }

    @Test
    @DisplayName("GET /api/v1/payment/status/{orderNumber} - should query status by orderNumber")
    void shouldGetStatusByOrderNumber() throws Exception {
        sessionRepository.save(PaymentSession.builder()
                .sessionId("sess_order_query")
                .orderNumber("ORD-5001")
                .email("order.buyer@example.com")
                .totalAmount(new BigDecimal("6200.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build());

        mockMvc.perform(get("/api/v1/payment/status/ORD-5001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.sessionId", is("sess_order_query")))
                .andExpect(jsonPath("$.orderNumber", is("ORD-5001")))
                .andExpect(jsonPath("$.status", is("PENDING")));
    }

    @Test
    @DisplayName("GET /actuator/health - should return UP")
    void shouldReturnActuatorHealthUp() throws Exception {
        mockMvc.perform(get("/actuator/health"))
                .andDo(org.springframework.test.web.servlet.result.MockMvcResultHandlers.print())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("UP")));
    }
}
