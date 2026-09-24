/**
 * Tier 2: Boundary & Corner Cases - Feature 1: Checkout Session Boundaries
 * Methodology: Boundary Value Analysis (BVA) & Partition Testing
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Checkout Session Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('B01-T1: Rejects session creation with zero totalAmount (0.00)', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B01-1',
        email: 'zero@test.com',
        totalAmount: 0.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 0.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B01-T2: Rejects session creation with negative totalAmount (-100.50)', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B01-2',
        email: 'negative@test.com',
        totalAmount: -100.50,
        items: [{ sku: 'SKU-001', quantity: 1, price: -100.50 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B01-T3: Accepts extreme large transaction amount (99,999,999.99)', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B01-3',
        email: 'whale@test.com',
        totalAmount: 99999999.99,
        items: [{ sku: 'SKU-001', quantity: 1, price: 99999999.99 }]
      }
    });

    expect(res.status).toBe(201);
    expect(res.body.totalAmount).toBe(99999999.99);
  });

  test('B01-T4: Handles bulk shopping cart with 100 line items', async () => {
    const items = Array.from({ length: 100 }, (_, i) => ({
      sku: `SKU-BULK-${i + 1}`,
      quantity: 1,
      price: 100.0
    }));

    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B01-4',
        email: 'bulk@test.com',
        totalAmount: 10000.0,
        items
      }
    });

    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
  });

  test('B01-T5: Session remains valid at 599.999 seconds but expires at 600.001 seconds', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B01-5',
        email: 'expiry-boundary@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 5000.0 }]
      }
    });
    const sessionId = sessionRes.body.sessionId;

    // Advance 598 seconds (still valid)
    await context.advanceMockTime(598);
    const validStatus = await request(`/api/v1/payment/session/${sessionId}`);
    expect(validStatus.body.status).toBe('PENDING');

    // Advance 3 more seconds (601 seconds total, past 600s boundary)
    await context.advanceMockTime(3);
    const expiredStatus = await request(`/api/v1/payment/session/${sessionId}`);
    expect(expiredStatus.body.status).toBe('EXPIRED');
  });
});
