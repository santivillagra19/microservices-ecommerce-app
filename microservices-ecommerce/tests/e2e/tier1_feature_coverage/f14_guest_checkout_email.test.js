/**
 * Tier 1: Feature 14 - Guest Checkout by Email
 * Requirement: ORIGINAL_REQUEST §R2, Acceptance Criteria
 * Interface Contract: PROJECT.md §14
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 14: Guest Checkout by Email', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F14-T1: Guest user completes session creation without authentication or JWT credentials', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      headers: {}, // Zero auth headers
      body: {
        orderNumber: 'ORD-GUEST-1',
        email: 'guest.shopper@gmail.com',
        totalAmount: 12000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 12000.0 }]
      }
    });

    expect(res.status).toBe(201);
    expect(res.body.sessionId).toBeDefined();
    expect(res.body.orderNumber).toBe('ORD-GUEST-1');
  });

  test('F14-T2: Email validation rejects malformed email address with 400 Bad Request', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-GUEST-2',
        email: 'invalid-email-format-no-domain',
        totalAmount: 12000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 12000.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('F14-T3: Email validation rejects empty or missing email with 400 Bad Request', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-GUEST-3',
        email: '',
        totalAmount: 12000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 12000.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('F14-T4: Guest email with leading/trailing whitespaces is automatically sanitized/trimmed', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-GUEST-4',
        email: '  padded.email@test.com  ',
        totalAmount: 12000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 12000.0 }]
      }
    });

    expect(res.status).toBe(201);

    const sessionRes = await request(`/api/v1/payment/session/${res.body.sessionId}`);
    expect(sessionRes.status).toBe(200);
  });

  test('F14-T5: Guest email with plus-tagging and subdomains is supported', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-GUEST-5',
        email: 'buyer+checkout@store.subdomain.org',
        totalAmount: 12000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 12000.0 }]
      }
    });

    expect(res.status).toBe(201);
  });

  test('F14-T6: Guest email is forwarded to RabbitMQ notification event upon payment completion', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-GUEST-6',
        email: 'notify.guest@domain.com',
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
    const event = events.find(e => e.payload && e.payload.orderNumber === 'ORD-GUEST-6');
    expect(event).toBeDefined();
    expect(event.payload.email).toBe('notify.guest@domain.com');
  });
});
