package com.ecommerce.payment_service.service;

import com.ecommerce.payment_service.dto.*;
import com.ecommerce.payment_service.exception.InvalidSessionStateException;
import com.ecommerce.payment_service.exception.ResourceNotFoundException;
import com.ecommerce.payment_service.exception.SessionExpiredException;
import com.ecommerce.payment_service.model.*;
import com.ecommerce.payment_service.repository.PaymentRecordRepository;
import com.ecommerce.payment_service.repository.PaymentSessionRepository;
import com.ecommerce.payment_service.service.impl.PaymentServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PaymentServiceImplTest {

    @Mock
    private PaymentSessionRepository sessionRepository;

    @Mock
    private PaymentRecordRepository recordRepository;

    @Mock
    private MercadoPagoClient mercadoPagoClient;

    @InjectMocks
    private PaymentServiceImpl paymentService;

    private PaymentSession activeSession;

    @BeforeEach
    void setUp() {
        activeSession = PaymentSession.builder()
                .sessionId("sess_12345")
                .orderNumber("ORD-999")
                .email("buyer@example.com")
                .totalAmount(new BigDecimal("12000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build();
    }

    @Test
    @DisplayName("Should create payment session with 10-minute expiry")
    void shouldCreateSessionSuccessfully() {
        PaymentSessionRequest request = PaymentSessionRequest.builder()
                .orderNumber("ORD-999")
                .email("buyer@example.com")
                .totalAmount(new BigDecimal("12000.00"))
                .currency("ARS")
                .items(List.of(OrderItemDTO.builder()
                        .sku("SKU-100")
                        .quantity(2)
                        .price(new BigDecimal("6000.00"))
                        .build()))
                .build();

        PaymentSessionResponse response = paymentService.createSession(request);

        assertNotNull(response);
        assertNotNull(response.getSessionId());
        assertTrue(response.getSessionId().startsWith("sess_"));
        assertEquals("ORD-999", response.getOrderNumber());
        assertEquals("buyer@example.com", response.getEmail());
        assertEquals(new BigDecimal("12000.00"), response.getTotalAmount());
        assertEquals(PaymentStatus.PENDING, response.getStatus());
        assertTrue(response.getRemainingSeconds() > 590 && response.getRemainingSeconds() <= 600);

        verify(sessionRepository, times(1)).save(any(PaymentSession.class));
    }

    @Test
    @DisplayName("Should process approved card payment")
    void shouldProcessCardPaymentApproved() {
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId("sess_12345")
                .token("mock_approved_token")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("buyer@example.com")
                .build();

        PaymentResponse mockMpResponse = PaymentResponse.builder()
                .paymentId("mp_test_123")
                .status(PaymentStatus.APPROVED)
                .orderNumber("ORD-999")
                .sessionId("sess_12345")
                .message("Payment approved successfully")
                .paymentMethod(PaymentMethod.MERCADOPAGO.name())
                .build();

        when(mercadoPagoClient.processPayment(any(CardPaymentRequest.class), any(BigDecimal.class), anyString()))
                .thenReturn(mockMpResponse);

        PaymentResponse response = paymentService.processCardPayment(request);

        assertNotNull(response);
        assertEquals(PaymentStatus.APPROVED, response.getStatus());
        assertEquals("mp_test_123", response.getPaymentId());
        assertEquals(PaymentStatus.APPROVED, activeSession.getStatus());

        verify(sessionRepository, times(1)).save(activeSession);
        verify(recordRepository, times(1)).save(any(PaymentRecord.class));
    }

    @Test
    @DisplayName("Should process rejected card payment")
    void shouldProcessCardPaymentRejected() {
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId("sess_12345")
                .token("token_insufficient_funds")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("buyer@example.com")
                .build();

        PaymentResponse mockMpResponse = PaymentResponse.builder()
                .paymentId("mp_rej_123")
                .status(PaymentStatus.REJECTED)
                .orderNumber("ORD-999")
                .sessionId("sess_12345")
                .message("Payment rejected: insufficient funds")
                .paymentMethod(PaymentMethod.MERCADOPAGO.name())
                .build();

        when(mercadoPagoClient.processPayment(any(CardPaymentRequest.class), any(BigDecimal.class), anyString()))
                .thenReturn(mockMpResponse);

        PaymentResponse response = paymentService.processCardPayment(request);

        assertNotNull(response);
        assertEquals(PaymentStatus.REJECTED, response.getStatus());
        assertEquals(PaymentStatus.REJECTED, activeSession.getStatus());
    }

    @Test
    @DisplayName("Should reject card payment if session is expired")
    void shouldRejectCardPaymentOnExpiredSession() {
        activeSession.setExpiresAt(Instant.now().minus(Duration.ofMinutes(1)));
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId("sess_12345")
                .token("mock_token")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("buyer@example.com")
                .build();

        assertThrows(SessionExpiredException.class, () -> paymentService.processCardPayment(request));
        assertEquals(PaymentStatus.EXPIRED, activeSession.getStatus());
        verify(sessionRepository, times(1)).save(activeSession);
        verifyNoInteractions(mercadoPagoClient);
    }

    @Test
    @DisplayName("Should reject card payment if session is already approved")
    void shouldRejectCardPaymentOnAlreadyApprovedSession() {
        activeSession.setStatus(PaymentStatus.APPROVED);
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId("sess_12345")
                .token("mock_token")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("buyer@example.com")
                .build();

        assertThrows(InvalidSessionStateException.class, () -> paymentService.processCardPayment(request));
        verifyNoInteractions(mercadoPagoClient);
    }

    @Test
    @DisplayName("Should reject card payment if session is already confirmed")
    void shouldRejectCardPaymentOnAlreadyConfirmedSession() {
        activeSession.setStatus(PaymentStatus.CONFIRMED);
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        CardPaymentRequest request = CardPaymentRequest.builder()
                .sessionId("sess_12345")
                .token("mock_token")
                .paymentMethodId("visa")
                .installments(1)
                .payerEmail("buyer@example.com")
                .build();

        assertThrows(InvalidSessionStateException.class, () -> paymentService.processCardPayment(request));
        verifyNoInteractions(mercadoPagoClient);
    }

    @Test
    @DisplayName("Should confirm bank transfer and return demo coordinates")
    void shouldConfirmBankTransferSuccessfully() {
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId("sess_12345")
                .build();

        PaymentResponse response = paymentService.confirmBankTransfer(request);

        assertNotNull(response);
        assertEquals(PaymentStatus.CONFIRMED, response.getStatus());
        assertEquals("ORD-999", response.getOrderNumber());
        assertNotNull(response.getBankDetails());
        assertEquals(BankDetailsDTO.DEMO_CBU, response.getBankDetails().getCbu());
        assertEquals(BankDetailsDTO.DEMO_CUIL, response.getBankDetails().getCuil());
        assertEquals(BankDetailsDTO.DEMO_TITULAR, response.getBankDetails().getTitular());

        assertEquals(PaymentStatus.CONFIRMED, activeSession.getStatus());
        verify(sessionRepository, times(1)).save(activeSession);
        verify(recordRepository, times(1)).save(any(PaymentRecord.class));
    }

    @Test
    @DisplayName("Should be idempotent when confirming bank transfer on already confirmed session")
    void shouldHandleBankTransferIdempotency() {
        activeSession.setStatus(PaymentStatus.CONFIRMED);
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId("sess_12345")
                .build();

        PaymentResponse response = paymentService.confirmBankTransfer(request);

        assertNotNull(response);
        assertEquals(PaymentStatus.CONFIRMED, response.getStatus());
        assertEquals("sess_12345", response.getSessionId());
        verify(recordRepository, never()).save(any(PaymentRecord.class));
    }

    @Test
    @DisplayName("Should reject bank transfer on expired session")
    void shouldRejectBankTransferOnExpiredSession() {
        activeSession.setExpiresAt(Instant.now().minus(Duration.ofMinutes(5)));
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        BankTransferConfirmRequest request = BankTransferConfirmRequest.builder()
                .sessionId("sess_12345")
                .build();

        assertThrows(SessionExpiredException.class, () -> paymentService.confirmBankTransfer(request));
        assertEquals(PaymentStatus.EXPIRED, activeSession.getStatus());
    }

    @Test
    @DisplayName("Should get payment status by session ID")
    void shouldGetStatusBySessionId() {
        when(sessionRepository.findBySessionId("sess_12345")).thenReturn(Optional.of(activeSession));

        PaymentStatusResponse status = paymentService.getStatusBySessionId("sess_12345");

        assertNotNull(status);
        assertEquals("sess_12345", status.getSessionId());
        assertEquals("ORD-999", status.getOrderNumber());
        assertEquals(PaymentStatus.PENDING, status.getStatus());
        assertTrue(status.getRemainingSeconds() > 0);
    }

    @Test
    @DisplayName("Should throw ResourceNotFoundException when querying unknown session")
    void shouldThrowWhenSessionNotFound() {
        when(sessionRepository.findBySessionId("unknown_sess")).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class, () -> paymentService.getStatusBySessionId("unknown_sess"));
    }
}
