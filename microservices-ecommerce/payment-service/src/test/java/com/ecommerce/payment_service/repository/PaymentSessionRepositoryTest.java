package com.ecommerce.payment_service.repository;

import com.ecommerce.payment_service.model.OrderItemEmbeddable;
import com.ecommerce.payment_service.model.PaymentSession;
import com.ecommerce.payment_service.model.PaymentStatus;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.data.jpa.test.autoconfigure.DataJpaTest;

import java.math.BigDecimal;
import java.time.Duration;
import java.time.Instant;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

@DataJpaTest
class PaymentSessionRepositoryTest {

    @Autowired
    private PaymentSessionRepository sessionRepository;

    @Test
    @DisplayName("Should save and retrieve payment session by sessionId")
    void shouldSaveAndFindBySessionId() {
        PaymentSession session = PaymentSession.builder()
                .sessionId("sess_test_123")
                .orderNumber("ORD-1001")
                .email("buyer@example.com")
                .totalAmount(new BigDecimal("1500.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .items(List.of(OrderItemEmbeddable.builder()
                        .sku("SKU-1")
                        .quantity(2)
                        .price(new BigDecimal("750.00"))
                        .build()))
                .build();

        sessionRepository.save(session);

        Optional<PaymentSession> found = sessionRepository.findBySessionId("sess_test_123");
        assertTrue(found.isPresent());
        assertEquals("ORD-1001", found.get().getOrderNumber());
        assertEquals("buyer@example.com", found.get().getEmail());
        assertEquals(1, found.get().getItems().size());
        assertEquals("SKU-1", found.get().getItems().get(0).getSku());
    }

    @Test
    @DisplayName("Should find payment session by orderNumber")
    void shouldFindByOrderNumber() {
        PaymentSession session = PaymentSession.builder()
                .sessionId("sess_test_456")
                .orderNumber("ORD-1002")
                .email("guest@example.com")
                .totalAmount(new BigDecimal("2000.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now())
                .expiresAt(Instant.now().plus(Duration.ofMinutes(10)))
                .build();

        sessionRepository.save(session);

        Optional<PaymentSession> found = sessionRepository.findByOrderNumber("ORD-1002");
        assertTrue(found.isPresent());
        assertEquals("sess_test_456", found.get().getSessionId());
    }

    @Test
    @DisplayName("Should find expired sessions")
    void shouldFindExpiredSessions() {
        PaymentSession expiredSession = PaymentSession.builder()
                .sessionId("sess_expired")
                .orderNumber("ORD-EXPIRED")
                .email("expired@example.com")
                .totalAmount(new BigDecimal("500.00"))
                .currency("ARS")
                .status(PaymentStatus.PENDING)
                .createdAt(Instant.now().minus(Duration.ofMinutes(20)))
                .expiresAt(Instant.now().minus(Duration.ofMinutes(10)))
                .build();

        sessionRepository.save(expiredSession);

        List<PaymentSession> expired = sessionRepository.findByStatusAndExpiresAtBefore(
                PaymentStatus.PENDING, Instant.now()
        );

        assertFalse(expired.isEmpty());
        assertTrue(expired.stream().anyMatch(s -> "sess_expired".equals(s.getSessionId())));
    }
}
