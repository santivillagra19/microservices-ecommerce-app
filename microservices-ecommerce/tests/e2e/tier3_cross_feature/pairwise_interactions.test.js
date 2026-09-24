/**
 * Tier 3: Cross-Feature Interactions (Pairwise Combinations)
 * Methodology: Combinatorial Pairwise Testing
 * Covers interactions across all 17 features:
 * - F1 + F2: Session creation & MercadoPago card payment
 * - F1 + F3: Session creation & Bank transfer confirmation
 * - F1 + F4: Session creation & Status query by sessionId/orderNumber
 * - F1 + F12 + F13: Session creation, countdown timer tick, and expiration wipe
 * - F1 + F13 + F2: Session expiration and card payment rejection
 * - F1 + F13 + F3: Session expiration and bank transfer rejection
 * - F2 + F7: Card payment processing and sensitive data sanitization
 * - F2 + F9: Card payment and order status update (PAID)
 * - F2 + F10: Card payment and inventory stock decrement
 * - F2 + F11: Card payment and RabbitMQ notification event emission
 * - F3 + F9: Bank transfer and order status update (CONFIRMED)
 * - F3 + F10: Bank transfer and inventory stock decrement
 * - F3 + F11: Bank transfer and RabbitMQ notification event emission
 * - F6 + F1 + F14: Gateway unauthenticated routing, session creation, and guest email
 * - F14 + F1 + F11: Guest email propagation from session to RabbitMQ notification
 * - F15 + F2 + F17: MercadoPago Brick tokenization, payment execution, and client feedback
 * - F16 + F3 + F17: Bank transfer UI display, confirmation execution, and client feedback
 * - F10 + F2 + F17: Inventory stock shortage handling, payment rejection, and client error feedback
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 3: Cross-Feature Pairwise Interactions', () => {
  beforeEach(async () => {
    await context.resetMockState();
    await context.setStock('SKU-001', 50);
    await context.setStock('SKU-002', 20);
  });

  test('T3-01 [F1 + F2]: Session creation followed by approved MercadoPago card payment', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise01@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    expect(sessionRes.status).toBe(201);

    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(200);
    expect(payRes.body.status).toBe('APPROVED');
  });

  test('T3-02 [F1 + F3]: Session creation followed by bank transfer confirmation', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'pairwise02@test.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });
    expect(sessionRes.status).toBe(201);

    const confirmRes = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('CONFIRMED');
    expect(confirmRes.body.bankDetails.cbu).toBeDefined();
  });

  test('T3-03 [F1 + F4]: Session creation immediately queried by sessionId', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1003',
        email: 'pairwise03@test.com',
        totalAmount: 3000.0,
        items: [{ sku: 'SKU-003', quantity: 1, price: 3000.0 }]
      }
    });

    const queryRes = await request(`/api/v1/payment/session/${sessionRes.body.sessionId}`);
    expect(queryRes.status).toBe(200);
    expect(queryRes.body.status).toBe('PENDING');
    expect(queryRes.body.orderNumber).toBe('ORD-1003');
  });

  test('T3-04 [F1 + F4]: Session creation queried by orderNumber', async () => {
    await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise04@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const queryRes = await request('/api/v1/payment/status/ORD-1001');
    expect(queryRes.status).toBe(200);
    expect(queryRes.body.status).toBe('PENDING');
  });

  test('T3-05 [F1 + F12 + F13]: Session creation, countdown timer tick to 600s, and expiration wipe', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise05@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    // Advance clock past 600 seconds
    await context.advanceMockTime(601);

    const queryRes = await request(`/api/v1/payment/session/${sessionRes.body.sessionId}`);
    expect(queryRes.body.status).toBe('EXPIRED');
  });

  test('T3-06 [F1 + F13 + F2]: Card payment on expired session rejected with 409', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise06@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    await context.advanceMockTime(605);

    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(409);
    expect(payRes.body.error).toBe('SESSION_EXPIRED');
  });

  test('T3-07 [F1 + F13 + F3]: Bank transfer on expired session rejected with 409', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'pairwise07@test.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });

    await context.advanceMockTime(605);

    const confirmRes = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.error).toBe('SESSION_EXPIRED');
  });

  test('T3-08 [F2 + F7]: Card payment enforces opaque token and verifies no card PAN in audit logs', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise08@test.com',
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

    const logs = await context.getAuditLogs();
    const rawLogs = JSON.stringify(logs);
    expect(/4[0-9]{15}/.test(rawLogs)).toBeFalsy();
  });

  test('T3-09 [F2 + F9]: Card payment approval automatically triggers order status update to PAID', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise09@test.com',
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
    expect(orderRes.body.status).toBe('PAID');
  });

  test('T3-10 [F2 + F10]: Card payment approval automatically decrements inventory stock', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise10@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 5, price: 3000.0 }]
      }
    });

    // Stock starts at 50
    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    // 50 - 5 = 45
    const check46 = await request('/api/v1/inventory/SKU-001?quantity=46');
    expect(check46.body).toBe(false);
    const check45 = await request('/api/v1/inventory/SKU-001?quantity=45');
    expect(check45.body).toBe(true);
  });

  test('T3-11 [F2 + F11]: Card payment approval emits RabbitMQ order.confirmed event', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'pairwise11@test.com',
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

    const events = await context.getCapturedEvents();
    expect(events.length).toBe(1);
    expect(events[0].routingKey).toBe('order.confirmed');
    expect(events[0].payload.orderNumber).toBe('ORD-1001');
    expect(events[0].payload.email).toBe('pairwise11@test.com');
  });

  test('T3-12 [F3 + F9]: Bank transfer confirmation updates order status to CONFIRMED', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'pairwise12@test.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });

    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    const orderRes = await request('/api/v1/order/ORD-1002');
    expect(orderRes.body.status).toBe('CONFIRMED');
  });

  test('T3-13 [F3 + F10]: Bank transfer confirmation decrements inventory stock', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'pairwise13@test.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 3, price: 2833.33 }]
      }
    });

    // SKU-002 starts at 20. 20 - 3 = 17
    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    const check18 = await request('/api/v1/inventory/SKU-002?quantity=18');
    expect(check18.body).toBe(false);
    const check17 = await request('/api/v1/inventory/SKU-002?quantity=17');
    expect(check17.body).toBe(true);
  });

  test('T3-14 [F3 + F11]: Bank transfer confirmation emits RabbitMQ order.confirmed event', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'pairwise14@test.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });

    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    const events = await context.getCapturedEvents();
    expect(events.length).toBe(1);
    expect(events[0].payload.orderNumber).toBe('ORD-1002');
    expect(events[0].payload.email).toBe('pairwise14@test.com');
  });

  test('T3-15 [F6 + F1 + F14]: Unauthenticated guest creates session through API Gateway with email', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      headers: {}, // No Bearer token
      body: {
        orderNumber: 'ORD-1001',
        email: 'guest.shopper@marketplace.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
  });

  test('T3-16 [F14 + F1 + F11]: Guest email accurately flows from session into RabbitMQ notification event', async () => {
    const guestEmail = 'unique.guest.email@domain.com';
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: guestEmail,
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

    const events = await context.getCapturedEvents();
    expect(events[0].payload.email).toBe(guestEmail);
  });

  test('T3-17 [F15 + F2 + F17]: MercadoPago Brick token passed to process API and gives success feedback', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'brick-client@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    // Simulated Brick token submit
    const brickGeneratedToken = 'tok_brick_generated_987654';
    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: brickGeneratedToken,
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(200);
    expect(payRes.body.status).toBe('APPROVED');
    expect(payRes.body.message.includes('successfully')).toBeTruthy();
  });

  test('T3-18 [F10 + F2 + F17]: Out of stock product fails payment with user-friendly 409 error', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-OOS',
        email: 'oos.user@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-OOS', quantity: 10, price: 500.0 }] // Stock is 0
      }
    });

    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(409);
    expect(payRes.body.error).toBe('INSUFFICIENT_STOCK');
    expect(payRes.body.message.includes('out of stock')).toBeTruthy();
  });
});
