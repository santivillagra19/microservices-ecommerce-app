package com.ecommerce.payment_service.repository;

import com.ecommerce.payment_service.model.PaymentRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentRecordRepository extends JpaRepository<PaymentRecord, Long> {
    Optional<PaymentRecord> findByPaymentId(String paymentId);
    List<PaymentRecord> findBySessionId(String sessionId);
    List<PaymentRecord> findByOrderNumber(String orderNumber);
}
