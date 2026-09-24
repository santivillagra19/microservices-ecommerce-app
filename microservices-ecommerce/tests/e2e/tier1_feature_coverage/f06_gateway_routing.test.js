/**
 * Tier 1: Feature 6 - Gateway Routing & Guest Checkout Security
 * Requirement: ORIGINAL_REQUEST §R1, §R3
 * Interface Contract: PROJECT.md §1
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 6: Gateway Routing & Guest Checkout Security', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F6-T1: Gateway routes POST /api/v1/payment/session without Authorization header for guests', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      headers: {}, // No Authorization header
      body: {
        orderNumber: 'ORD-1001',
        email: 'guest@shop.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    // Must not be 401 or 403
    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
  });

  test('F6-T2: Gateway routes POST /api/v1/payment/process without Authorization header', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'guest@shop.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      headers: {},
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('APPROVED');
  });

  test('F6-T3: Gateway routes POST /api/v1/payment/bank-transfer/confirm without Authorization header', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'guest@shop.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      headers: {},
      body: { sessionId: sessionRes.body.sessionId }
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('CONFIRMED');
  });

  test('F6-T4: Gateway permits GET /api/v1/payment/session/{id} status queries for unauthenticated buyers', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'guest@shop.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const res = await request(`/api/v1/payment/session/${sessionRes.body.sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING');
  });

  test('F6-T5: Gateway handles CORS preflight OPTIONS request on payment endpoints', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'http://localhost:5173',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });

    expect(res.status === 204 || res.status === 200).toBeTruthy();
    expect(res.headers['access-control-allow-origin']).toBeDefined();
  });

  test('F6-T6: Unmatched routes outside payment and openapi return 404', async () => {
    const res = await request('/api/v1/non-existent-service/endpoint');
    expect(res.status).toBe(404);
  });
});
