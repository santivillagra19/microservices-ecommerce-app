package com.ecommerce.payment_service.repository;

import com.ecommerce.payment_service.model.PaymentSession;
import com.ecommerce.payment_service.model.PaymentStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentSessionRepository extends JpaRepository<PaymentSession, Long> {
    Optional<PaymentSession> findBySessionId(String sessionId);
    Optional<PaymentSession> findByOrderNumber(String orderNumber);
    List<PaymentSession> findByStatusAndExpiresAtBefore(PaymentStatus status, Instant now);
}
