/**
 * Tier 1: Feature 10 - Inventory Stock Decrement (Post-Payment Orchestration)
 * Requirement: ORIGINAL_REQUEST §R4, Acceptance Criteria
 * Interface Contract: PROJECT.md §3
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 10: Inventory Stock Decrement', () => {
  beforeEach(async () => {
    await context.resetMockState();
    await context.setStock('SKU-001', 50);
  });

  test('F10-T1: Successful card payment automatically decrements stock in inventory-service', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'stock-check@example.com',
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

    // Verification: SKU-001 had 50, decremented by 2 -> 48
    const checkStock = await request('/api/v1/inventory/SKU-001?quantity=49');
    expect(checkStock.body).toBe(false); // 49 is not available
    const checkValid = await request('/api/v1/inventory/SKU-001?quantity=48');
    expect(checkValid.body).toBe(true);  // 48 is available
  });

  test('F10-T2: Bank transfer confirmation automatically decrements stock', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'transfer-stock@example.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-001', quantity: 5, price: 1700.0 }]
      }
    });

    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    // 50 - 5 = 45 available
    const checkStock = await request('/api/v1/inventory/SKU-001?quantity=46');
    expect(checkStock.body).toBe(false);
    const checkValid = await request('/api/v1/inventory/SKU-001?quantity=45');
    expect(checkValid.body).toBe(true);
  });

  test('F10-T3: Direct PUT /api/v1/inventory/reduce/{sku}?quantity={quantity} returns 200 and success string', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-001?quantity=3', {
      method: 'PUT'
    });

    expect(res.status).toBe(200);
    expect(res.rawText.includes('Stock reducido exitosamente')).toBeTruthy();
  });

  test('F10-T4: Attempting to reduce stock beyond available returns 400 INSUFFICIENT_STOCK', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-001?quantity=999', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INSUFFICIENT_STOCK');
  });

  test('F10-T5: Attempting to reduce stock with negative quantity returns 400 Bad Request', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-001?quantity=-5', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BAD_REQUEST');
  });

  test('F10-T6: Reducing stock for non-existent SKU returns 404 Not Found', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-NON-EXISTENT-XYZ?quantity=1', {
      method: 'PUT'
    });

    expect(res.status).toBe(404);
  });
});
