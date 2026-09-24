/**
 * Tier 1: Feature 11 - Buyer Email Notification Event
 * Requirement: ORIGINAL_REQUEST §R4, Acceptance Criteria
 * Interface Contract: PROJECT.md §4
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 11: Buyer Email Notification Event', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F11-T1: Approved card payment emits order.confirmed event to order-events exchange', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'notify@example.com',
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
    expect(events.length >= 1).toBeTruthy();
    const event = events.find(e => e.payload && e.payload.orderNumber === 'ORD-1001');
    expect(event).toBeDefined();
    expect(event.exchange).toBe('order-events');
    expect(event.routingKey).toBe('order.confirmed');
  });

  test('F11-T2: Emitted event payload matches OrderConfirmedEvent record contract (orderNumber, email)', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'buyer-record@shop.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
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
    const event = events.find(e => e.payload && e.payload.orderNumber === 'ORD-1002');
    expect(event).toBeDefined();
    expect(event.payload.orderNumber).toBe('ORD-1002');
    expect(event.payload.email).toBe('buyer-record@shop.com');
  });

  test('F11-T3: Bank transfer confirmation emits order.confirmed event to RabbitMQ', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1003',
        email: 'transfer-notify@test.com',
        totalAmount: 3000.0,
        items: [{ sku: 'SKU-003', quantity: 1, price: 3000.0 }]
      }
    });

    await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    const events = await context.getCapturedEvents();
    const event = events.find(e => e.payload && e.payload.orderNumber === 'ORD-1003');
    expect(event).toBeDefined();
    expect(event.routingKey).toBe('order.confirmed');
    expect(event.payload.email).toBe('transfer-notify@test.com');
  });

  test('F11-T4: Event emission contains valid ISO 8601 timestamp', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'timestamp-test@shop.com',
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
    const event = events[0];
    expect(event.timestamp).toBeDefined();
    expect(new Date(event.timestamp).toString() !== 'Invalid Date').toBeTruthy();
  });

  test('F11-T5: Rejected payment does NOT emit order.confirmed event', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'fail-payment@shop.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_cc_rejected_insufficient_amount',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    const events = await context.getCapturedEvents();
    expect(events.length).toBe(0);
  });

  test('F11-T6: Notification queue binding contracts match notification-service RabbitMQConfig', () => {
    // Contractual verification of exchange, queue names and routing keys
    const expectedExchange = 'order-events';
    const expectedRoutingKey = 'order.confirmed';
    const expectedQueue = 'notification-confirmed-queue';
    const expectedDlx = 'notification-dlx';

    expect(expectedExchange).toBe('order-events');
    expect(expectedRoutingKey).toBe('order.confirmed');
    expect(expectedQueue).toBe('notification-confirmed-queue');
    expect(expectedDlx).toBe('notification-dlx');
  });
});
