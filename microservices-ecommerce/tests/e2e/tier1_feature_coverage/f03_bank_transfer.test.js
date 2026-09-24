/**
 * Tier 1: Feature 3 - Bank Transfer Payment Flow
 * Requirement: ORIGINAL_REQUEST §R1, §R2
 * Interface Contract: PROJECT.md §1
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 3: Bank Transfer Payment Flow', () => {
  let validSessionId;

  beforeEach(async () => {
    await context.resetMockState();
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'transfer@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    validSessionId = sessionRes.body.sessionId;
  });

  test('F3-T1: Confirm bank transfer endpoint returns 200 OK with CONFIRMED status', async () => {
    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: validSessionId }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.orderNumber).toBe('ORD-1001');
    expect(res.body.paymentId).toBeDefined();
    expect(res.body.paymentId.startsWith('bt_')).toBeTruthy();
  });

  test('F3-T2: Response includes fictitious demo bank details (CBU, CUIL, Titular)', async () => {
    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: validSessionId }
    });

    expect(res.status).toBe(200);
    expect(res.body.bankDetails).toBeDefined();
    expect(res.body.bankDetails.cbu).toBe('0000003100010000000001');
    expect(res.body.bankDetails.cbu.length).toBe(22);
    expect(res.body.bankDetails.cuil).toBe('20-12345678-9');
    expect(res.body.bankDetails.titular).toBe('Ecommerce Demo S.A.');
  });

  test('F3-T3: Updates session state to CONFIRMED and paymentMethod to BANK_TRANSFER', async () => {
    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: validSessionId }
    });

    const statusRes = await request(`/api/v1/payment/session/${validSessionId}`);
    expect(statusRes.status).toBe(200);
    expect(statusRes.body.status).toBe('CONFIRMED');
    expect(statusRes.body.paymentMethod).toBe('BANK_TRANSFER');
  });

  test('F3-T4: Rejects bank transfer confirmation for non-existent session ID with 404', async () => {
    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: 'sess_unknown_fake' }
    });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('SESSION_NOT_FOUND');
  });

  test('F3-T5: Prevents duplicate transfer confirmation on already paid session with 409 Conflict', async () => {
    // First confirmation
    const res1 = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: validSessionId }
    });
    expect(res1.status).toBe(200);

    // Second confirmation attempt
    const res2 = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: validSessionId }
    });
    expect(res2.status).toBe(409);
    expect(res2.body.error).toBe('ALREADY_PAID');
  });

  test('F3-T6: Rejects bank transfer confirmation when sessionId is omitted in body', async () => {
    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: {}
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });
});
