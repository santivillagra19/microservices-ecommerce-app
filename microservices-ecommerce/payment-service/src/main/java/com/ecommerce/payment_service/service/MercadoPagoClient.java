package com.ecommerce.payment_service.service;

import com.ecommerce.payment_service.dto.CardPaymentRequest;
import com.ecommerce.payment_service.dto.PaymentResponse;

import java.math.BigDecimal;

public interface MercadoPagoClient {
    PaymentResponse processPayment(CardPaymentRequest request, BigDecimal amount, String orderNumber);
}
