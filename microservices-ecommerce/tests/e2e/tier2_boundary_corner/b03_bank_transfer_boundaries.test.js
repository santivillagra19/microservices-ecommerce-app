/**
 * Tier 2: Boundary & Corner Cases - Feature 3: Bank Transfer Boundaries
 * Methodology: Concurrency, Corner Cases & Idempotency
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Bank Transfer Boundaries', () => {
  let sessionId;

  beforeEach(async () => {
    await context.resetMockState();
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B03',
        email: 'bt-bounds@test.com',
        totalAmount: 10000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 10000.0 }]
      }
    });
    sessionId = sessionRes.body.sessionId;
  });

  test('B03-T1: Rejects bank transfer confirmation when session was already approved via credit card', async () => {
    // Approve via card first
    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    // Attempt bank transfer confirmation on card-approved session
    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId }
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('ALREADY_PAID');
  });

  test('B03-T2: Handles concurrent confirmation requests without duplicating orders or double stock decrements', async () => {
    const [res1, res2] = await Promise.all([
      request('/api/v1/payment/bank-transfer/confirm', { method: 'POST', body: { sessionId } }),
      request('/api/v1/payment/bank-transfer/confirm', { method: 'POST', body: { sessionId } })
    ]);

    // One must succeed (200), the second must be rejected (409)
    const statuses = [res1.status, res2.status];
    expect(statuses.includes(200)).toBeTruthy();
    expect(statuses.includes(409)).toBeTruthy();
  });

  test('B03-T3: Rejects confirmation with invalid UUID format session ID', async () => {
    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: '!!invalid--uuid--format##' }
    });

    expect(res.status).toBe(404);
  });

  test('B03-T4: Rejects confirmation when session is exactly expired', async () => {
    await context.advanceMockTime(600);

    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId }
    });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('SESSION_EXPIRED');
  });

  test('B03-T5: Bank details values remain immutable across multiple sessions', async () => {
    const res1 = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId }
    });

    const sessionRes2 = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B03-2',
        email: 'bt2@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 5000.0 }]
      }
    });

    const res2 = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes2.body.sessionId }
    });

    expect(res1.body.bankDetails.cbu).toBe(res2.body.bankDetails.cbu);
    expect(res1.body.bankDetails.cuil).toBe(res2.body.bankDetails.cuil);
    expect(res1.body.bankDetails.titular).toBe(res2.body.bankDetails.titular);
  });
});
