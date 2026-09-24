/**
 * Tier 1: Feature 9 - Order Status Update (Post-Payment Orchestration)
 * Requirement: ORIGINAL_REQUEST §R4, Acceptance Criteria
 * Interface Contract: PROJECT.md §2
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 9: Order Status Update (Post-Payment)', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F9-T1: Successful card payment updates order status to PAID in order-service', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'order-update@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    const orderRes = await request('/api/v1/order/ORD-1001');
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.status).toBe('PAID');
  });

  test('F9-T2: Bank transfer confirmation updates order status to CONFIRMED in order-service', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'transfer-update@example.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });

    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    const orderRes = await request('/api/v1/order/ORD-1002');
    expect(orderRes.status).toBe(200);
    expect(orderRes.body.status).toBe('CONFIRMED');
  });

  test('F9-T3: Direct PUT /api/v1/order/{orderNumber}/status?status=PAID updates order correctly', async () => {
    const res = await request('/api/v1/order/ORD-1003/status?status=PAID', {
      method: 'PUT'
    });

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PAID');
  });

  test('F9-T4: PUT /api/v1/order/{orderNumber}/status with invalid status returns 400 Bad Request', async () => {
    const res = await request('/api/v1/order/ORD-1001/status?status=INVALID_STATUS', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
  });

  test('F9-T5: PUT /api/v1/order/{orderNumber}/status with non-existent order returns 404', async () => {
    const res = await request('/api/v1/order/ORD-UNKNOWN-999/status?status=PAID', {
      method: 'PUT'
    });

    expect(res.status).toBe(404);
  });

  test('F9-T6: Querying order details confirms status transition from PLACED to PAID', async () => {
    const initialOrder = await request('/api/v1/order/ORD-1001');
    expect(initialOrder.body.status).toBe('PLACED');

    await request('/api/v1/order/ORD-1001/status?status=PAID', { method: 'PUT' });

    const updatedOrder = await request('/api/v1/order/ORD-1001');
    expect(updatedOrder.body.status).toBe('PAID');
  });
});
