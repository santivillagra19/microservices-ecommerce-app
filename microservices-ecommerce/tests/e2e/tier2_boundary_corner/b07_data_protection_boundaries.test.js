/**
 * Tier 2: Boundary & Corner Cases - Feature 7: Data Protection Boundaries
 * Methodology: Adversarial Security Probing & Data Leakage Prevention
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Data Protection Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('B07-T1: Rejects adversarial attempt submitting 16-digit Visa PAN in root payload', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: 'sess_test',
        pan: '4532000012345678',
        cvv: '123'
      }
    });

    expect(res.status).toBe(400);
    expect(res.rawText.includes('4532000012345678')).toBeFalsy();
  });

  test('B07-T2: Rejects adversarial attempt submitting 15-digit Amex PAN in body', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: 'sess_test',
        cardNumber: '378282246310005',
        securityCode: '1234'
      }
    });

    expect(res.status).toBe(400);
    expect(res.rawText.includes('378282246310005')).toBeFalsy();
  });

  test('B07-T3: Audit logs mask any accidental sensitive keys automatically', async () => {
    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: 'sess_test',
        cardNumber: '4532000012345678',
        cvv: '999'
      }
    });

    const logs = await context.getAuditLogs();
    const rawLogs = JSON.stringify(logs);
    expect(rawLogs.includes('4532000012345678')).toBeFalsy();
    expect(rawLogs.includes('***MASKED***')).toBeTruthy();
  });

  test('B07-T4: Prevents SQL syntax errors from bubbling up to client in response body', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: "'; DROP TABLE payment_sessions; --",
        email: 'attacker@evil.com',
        totalAmount: 100.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 100.0 }]
      }
    });

    expect(res.rawText.includes('syntax error')).toBeFalsy();
    expect(res.rawText.includes('PostgreSQL')).toBeFalsy();
    expect(res.rawText.includes('SQLException')).toBeFalsy();
  });

  test('B07-T5: Backend does not accept raw payment card expiration fields', async () => {
    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: 'sess_test',
        cardExpiration: '12/28',
        cvv: '555'
      }
    });

    expect(res.status).toBe(400);
    expect(res.rawText.includes('12/28')).toBeFalsy();
  });
});
