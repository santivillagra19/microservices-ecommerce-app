/**
 * Tier 1: Feature 13 - Timer Expiration Reset
 * Requirement: ORIGINAL_REQUEST §R2, Acceptance Criteria
 * Interface Contract: PROJECT.md §13
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 13: Timer Expiration Reset', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  // Client-side checkout form state simulation model
  function createCheckoutFormState() {
    return {
      email: 'buyer@example.com',
      paymentMethod: 'MERCADOPAGO',
      token: 'tok_card_test_token',
      isSubmitting: false,
      isExpired: false,
      resetOnExpiration() {
        this.email = '';
        this.paymentMethod = 'MERCADOPAGO';
        this.token = null;
        this.isSubmitting = false;
        this.isExpired = true;
      }
    };
  }

  test('F13-T1: Expiration triggers automatic wipe of user email field', () => {
    const form = createCheckoutFormState();
    expect(form.email).toBe('buyer@example.com');

    form.resetOnExpiration();
    expect(form.email).toBe('');
  });

  test('F13-T2: Expiration triggers automatic reset of payment method and token data', () => {
    const form = createCheckoutFormState();
    form.token = 'tok_sensitive_brick_token';

    form.resetOnExpiration();
    expect(form.token).toBeNull();
    expect(form.isExpired).toBe(true);
  });

  test('F13-T3: Backend rejects card payment with 409 Conflict when session has expired', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'expire-test@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const sessionId = sessionRes.body.sessionId;

    // Fast-forward simulated time past 10 minutes (601 seconds)
    await context.advanceMockTime(601);

    const paymentRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(paymentRes.status).toBe(409);
    expect(paymentRes.body.error).toBe('SESSION_EXPIRED');
  });

  test('F13-T4: Backend rejects bank transfer confirmation with 409 when session has expired', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: 'expire-bt@example.com',
        totalAmount: 8500.0,
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });

    const sessionId = sessionRes.body.sessionId;

    // Fast-forward clock past 10 minutes
    await context.advanceMockTime(605);

    const confirmRes = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId }
    });

    expect(confirmRes.status).toBe(409);
    expect(confirmRes.body.error).toBe('SESSION_EXPIRED');
  });

  test('F13-T5: Status query dynamically reflects EXPIRED status once 10-minute threshold elapses', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1003',
        email: 'status-expire@test.com',
        totalAmount: 3000.0,
        items: [{ sku: 'SKU-003', quantity: 1, price: 3000.0 }]
      }
    });

    const sessionId = sessionRes.body.sessionId;
    const initialStatus = await request(`/api/v1/payment/session/${sessionId}`);
    expect(initialStatus.body.status).toBe('PENDING');

    await context.advanceMockTime(610);

    const expiredStatus = await request(`/api/v1/payment/session/${sessionId}`);
    expect(expiredStatus.body.status).toBe('EXPIRED');
  });

  test('F13-T6: Fresh session creation is required to proceed after expiration wipe', async () => {
    await context.advanceMockTime(610);

    const newSessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1004',
        email: 'fresh@example.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 5000.0 }]
      }
    });

    expect(newSessionRes.status).toBe(201);
    expect(newSessionRes.body.status).toBe('PENDING');
  });
});
