/**
 * Tier 1: Feature 2 - MercadoPago Sandbox Payment Processing
 * Requirement: ORIGINAL_REQUEST §R1, §R3
 * Interface Contract: PROJECT.md §1
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 2: MercadoPago Sandbox Payment Processing', () => {
  let validSessionId;

  beforeEach(async () => {
    await context.resetMockState();
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'mp-test@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    validSessionId = sessionRes.body.sessionId;
  });

  test('F2-T1: Successfully processes valid sandbox card token with 200 OK and APPROVED status', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: validSessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1,
        issuerId: '310',
        payerEmail: 'mp-test@example.com'
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.orderNumber).toBe('ORD-1001');
    expect(res.body.paymentId).toBeDefined();
    expect(res.body.paymentId.startsWith('mp_')).toBeTruthy();
  });

  test('F2-T2: Returns specific error status for sandbox test card with insufficient funds', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: validSessionId,
        token: 'tok_cc_rejected_insufficient_amount',
        paymentMethodId: 'visa',
        installments: 1,
        issuerId: '310',
        payerEmail: 'mp-test@example.com'
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.message).toBe('cc_rejected_insufficient_amount');
  });

  test('F2-T3: Returns specific error status for sandbox test card with bad security code', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: validSessionId,
        token: 'tok_cc_rejected_bad_filled_security_code',
        paymentMethodId: 'mastercard',
        installments: 1,
        issuerId: '310',
        payerEmail: 'mp-test@example.com'
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('REJECTED');
    expect(res.body.message).toBe('cc_rejected_bad_filled_security_code');
  });

  test('F2-T4: Updates payment session status to APPROVED after successful payment', async () => {
    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: validSessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1,
        issuerId: '310',
        payerEmail: 'mp-test@example.com'
      }
    });

    const statusRes = await request(`/api/v1/payment/session/${validSessionId}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('APPROVED');
    expect(statusRes.body.paymentMethod).toBe('MERCADOPAGO');
  });

  test('F2-T5: Rejects payment when token is missing or empty with 400 Bad Request', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: validSessionId,
        token: '',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('F2-T6: Rejects payment on unknown session ID with 404 Not Found', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: 'sess_unknown_999999999',
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });
});
