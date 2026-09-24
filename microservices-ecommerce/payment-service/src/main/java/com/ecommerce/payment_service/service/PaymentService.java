package com.ecommerce.payment_service.service;

import com.ecommerce.payment_service.dto.*;

public interface PaymentService {
    PaymentSessionResponse createSession(PaymentSessionRequest request);
    PaymentResponse processCardPayment(CardPaymentRequest request);
    PaymentResponse confirmBankTransfer(BankTransferConfirmRequest request);
    PaymentStatusResponse getStatusBySessionId(String sessionId);
    PaymentStatusResponse getStatusByOrderNumber(String orderNumber);
    BankDetailsDTO getBankTransferDetails();
}
