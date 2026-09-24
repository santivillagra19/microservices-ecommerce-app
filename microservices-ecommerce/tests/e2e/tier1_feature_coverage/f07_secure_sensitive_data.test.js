/**
 * Tier 1: Feature 7 - Secure Sensitive Data Protection
 * Requirement: ORIGINAL_REQUEST §R3, Acceptance Criteria
 * Interface Contract: PROJECT.md §7
 */

const { describe, test, expect, request, context } = require('../harness');
const fs = require('fs');
const path = require('path');

describe('Tier 1 - Feature 7: Secure Sensitive Data Protection', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F7-T1: Backend rejects direct raw card PAN and CVV payload submissions', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'security@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const insecurePayload = {
      sessionId: sessionRes.body.sessionId,
      cardNumber: '4532000011112222',
      cvv: '123',
      expirationMonth: '12',
      expirationYear: '2028'
    };

    const res = await request('/api/v1/payment/process', {
      method: 'POST',
      body: insecurePayload
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INSECURE_PAYLOAD');
    // Ensure raw card numbers are never echoed back in the response
    expect(res.rawText.includes('4532000011112222')).toBeFalsy();
  });

  test('F7-T2: Server audit logs never record credit card PAN or CVV numbers', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'audit@example.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        cardNumber: '4532000011112222',
        cvv: '999'
      }
    });

    const logs = await context.getAuditLogs();
    const logsString = JSON.stringify(logs);

    expect(logsString.includes('4532000011112222')).toBeFalsy();
    expect(logsString.includes('"cvv":"999"')).toBeFalsy();
  });

  test('F7-T3: Error responses do not leak Java stack traces or internal exceptions', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: { invalidJson: true }
    });

    expect(res.rawText.includes('java.lang.NullPointerException')).toBeFalsy();
    expect(res.rawText.includes('org.springframework')).toBeFalsy();
    expect(res.rawText.includes('at com.ecommerce')).toBeFalsy();
  });

  test('F7-T4: Sensitive MercadoPago access token is not hardcoded in codebase', () => {
    const projectRoot = path.resolve(__dirname, '../../../');
    // Check known config and source directories for hardcoded MP test tokens (TEST-...)
    const configDataDir = path.join(projectRoot, 'microservices-ecommerce', 'config-data');
    if (fs.existsSync(configDataDir)) {
      const files = fs.readdirSync(configDataDir);
      for (const file of files) {
        const content = fs.readFileSync(path.join(configDataDir, file), 'utf-8');
        // Token format: APP_USR-... or TEST-...
        expect(/TEST-[0-9]{14,}/.test(content)).toBeFalsy();
        expect(/APP_USR-[0-9]{14,}/.test(content)).toBeFalsy();
      }
    }
  });

  test('F7-T5: Backend validates and sanitizes input fields against XSS payloads', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: '<script>alert("xss")</script>',
        email: 'invalid-email-with-<script>',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('F7-T6: Response headers do not expose server platform versions (X-Powered-By)', async () => {
    const res = await request('/actuator/health');
    expect(res.headers['x-powered-by']).toBeUndefined();
  });
});
