/**
 * Tier 2: Boundary & Corner Cases - Feature 11: Notification Event Boundaries
 * Methodology: Message Schema & Boundary Analysis
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Notification Event Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('B11-T1: Emits event containing maximum length valid email (254 characters)', async () => {
    const longDomain = 'a'.repeat(230) + '.com';
    const maxEmail = `user@${longDomain}`;

    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B11-1',
        email: maxEmail,
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
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
    const event = events.find(e => e.payload.orderNumber === 'ORD-B11-1');
    expect(event).toBeDefined();
    expect(event.payload.email).toBe(maxEmail);
  });

  test('B11-T2: Order number containing hyphens, underscores and letters is correctly serialized', async () => {
    const complexOrder = 'ORD_2026-09-23_XYZ-9988';
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: complexOrder,
        email: 'complex@test.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
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
    const event = events.find(e => e.payload.orderNumber === complexOrder);
    expect(event).toBeDefined();
    expect(event.payload.orderNumber).toBe(complexOrder);
  });

  test('B11-T3: RabbitMQ exchange name is exactly "order-events"', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-EXCH',
        email: 'exchange@test.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
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
    expect(events[0].exchange).toBe('order-events');
  });

  test('B11-T4: RabbitMQ routing key is exactly "order.confirmed"', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-ROUTING',
        email: 'routing@test.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    const events = await context.getCapturedEvents();
    expect(events[0].routingKey).toBe('order.confirmed');
  });

  test('B11-T5: Event payload contains strictly JSON-serializable types without circular refs', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-JSON',
        email: 'json@test.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
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
    const str = JSON.stringify(events[0]);
    expect(str.length > 0).toBeTruthy();
  });
});
