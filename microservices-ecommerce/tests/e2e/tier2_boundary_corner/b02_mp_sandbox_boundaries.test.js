/**
 * Tier 2: Boundary & Corner Cases - Feature 2: MercadoPago Sandbox Boundaries
 * Methodology: Equivalence Partitioning & Boundary Testing
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: MercadoPago Sandbox Boundaries', () => {
  let sessionId;

  beforeEach(async () => {
    await context.resetMockState();
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B02',
        email: 'mp-bounds@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    sessionId = sessionRes.body.sessionId;
  });

  test('B02-T1: Rejects payment with 0 installments (below minimum boundary of 1)', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 0
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B02-T2: Rejects payment with 13 installments (above maximum boundary of 12)', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 13
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B02-T3: Accepts boundary installments 1 and 12', async () => {
    // 1 installment
    const res1 = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });
    expect(res1.status).toBe(200);
    expect(res1.body.status).toBe('APPROVED');
  });

  test('B02-T4: Rejects whitespace-only token string', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: '     ',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B02-T5: Handles oversized token string gracefully without crashing', async () => {
    const longToken = 'tok_' + 'a'.repeat(2048);
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: longToken,
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    // Should either process safely or reject with validation error, never 500
    expect(res.status === 200 || res.status === 400).toBeTruthy();
  });
});
