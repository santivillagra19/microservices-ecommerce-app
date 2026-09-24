/**
 * Tier 1: Feature 1 - Checkout Session Management
 * Requirement: ORIGINAL_REQUEST §R1
 * Interface Contract: PROJECT.md §1
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 1: Checkout Session Management', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F1-T1: Successfully creates a checkout session with 201 Created and PENDING status', async () => {
    const payload = {
      orderNumber: 'ORD-1001',
      email: 'buyer@example.com',
      totalAmount: 15000.0,
      currency: 'ARS',
      items: [
        { sku: 'SKU-001', quantity: 2, price: 7500.0 }
      ]
    };

    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: payload
    });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.orderNumber).toBe('ORD-1001');
    expect(res.body.totalAmount).toBe(15000.0);
    expect(res.body.currency).toBe('ARS');
    expect(res.body.sessionId).toBeDefined();
    expect(typeof res.body.sessionId).toBe('string');
  });

  test('F1-T2: Session expiresAt timestamp is set to exactly ~10 minutes (600s) from creation', async () => {
    const beforeTime = Date.now();
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'timer-check@example.com',
        totalAmount: 8500.0,
        currency: 'ARS',
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });

    expect(res.status).toBe(201);
    const expiresAt = new Date(res.body.expiresAt).getTime();
    const expectedExpiry = beforeTime + 10 * 60 * 1000;
    const diffSeconds = Math.abs(expiresAt - expectedExpiry) / 1000;

    // Tolerance of 5 seconds for test execution jitter
    expect(diffSeconds < 5).toBeTruthy();
  });

  test('F1-T3: Creates unique session ID for distinct checkout sessions', async () => {
    const res1 = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'user1@example.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 5000.0 }]
      }
    });

    const res2 = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'user2@example.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 5000.0 }]
      }
    });

    expect(res1.status).toBe(201);
    expect(res2.status).toBe(201);
    expect(res1.body.sessionId !== res2.body.sessionId).toBeTruthy();
  });

  test('F1-T4: Supports default currency ARS when not explicitly provided', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1003',
        email: 'currency@test.com',
        totalAmount: 3000.0,
        items: [{ sku: 'SKU-003', quantity: 1, price: 3000.0 }]
      }
    });

    expect(res.status).toBe(201);
    expect(res.body.currency).toBe('ARS');
  });

  test('F1-T5: Rejects session creation with 400 Bad Request when orderNumber is missing', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        email: 'no-order@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 5000.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('F1-T6: Rejects session creation with 400 Bad Request when items array is empty', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-EMPTY',
        email: 'empty@test.com',
        totalAmount: 5000.0,
        items: []
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });
});
