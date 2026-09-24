/**
 * Tier 1: Feature 4 - Payment Status Query
 * Requirement: ORIGINAL_REQUEST §R1
 * Interface Contract: PROJECT.md §1
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 4: Payment Status Query', () => {
  let sessionId;

  beforeEach(async () => {
    await context.resetMockState();
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'status-check@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    sessionId = sessionRes.body.sessionId;
  });

  test('F4-T1: GET /api/v1/payment/session/{sessionId} returns 200 with current session details', async () => {
    const res = await request(`/api/v1/payment/session/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.orderNumber).toBe('ORD-1001');
    expect(res.body.status).toBe('PENDING');
    expect(res.body.expiresAt).toBeDefined();
    expect(res.body.totalAmount).toBe(15000.0);
  });

  test('F4-T2: GET /api/v1/payment/status/{orderNumber} returns 200 with payment record', async () => {
    const res = await request('/api/v1/payment/status/ORD-1001');
    expect(res.status).toBe(200);
    expect(res.body.sessionId).toBe(sessionId);
    expect(res.body.orderNumber).toBe('ORD-1001');
    expect(res.body.status).toBe('PENDING');
  });

  test('F4-T3: Returns 404 Not Found for non-existent session ID', async () => {
    const res = await request('/api/v1/payment/session/sess_non_existent');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  test('F4-T4: Returns 404 Not Found for non-existent order number', async () => {
    const res = await request('/api/v1/payment/status/ORD-NON-EXISTENT-999');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('NOT_FOUND');
  });

  test('F4-T5: Reflects APPROVED status after card payment processed', async () => {
    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1,
        issuerId: '310',
        payerEmail: 'status-check@example.com'
      }
    });

    const res = await request(`/api/v1/payment/session/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
    expect(res.body.paymentMethod).toBe('MERCADOPAGO');
  });

  test('F4-T6: Reflects CONFIRMED status after bank transfer confirmed', async () => {
    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId }
    });

    const res = await request('/api/v1/payment/status/ORD-1001');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.paymentMethod).toBe('BANK_TRANSFER');
  });
});
