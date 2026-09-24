/**
 * Tier 2: Boundary & Corner Cases - Feature 4: Payment Status Query Boundaries
 * Methodology: Boundary Value Analysis & Injection Resilience
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Payment Status Query Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('B04-T1: Safely handles SQL Injection payload in session query URL without 500 error', async () => {
    const sqli = encodeURIComponent("' OR '1'='1");
    const res = await request(`/api/v1/payment/session/${sqli}`);
    expect(res.status).toBe(404);
  });

  test('B04-T2: Safely handles XSS script tag in order status query URL', async () => {
    const xss = encodeURIComponent('<script>alert("xss")</script>');
    const res = await request(`/api/v1/payment/status/${xss}`);
    expect(res.status).toBe(404);
  });

  test('B04-T3: Handles orderNumber with special punctuation and hyphens', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-SPECIAL_#001-2026',
        email: 'special@test.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    const res = await request(`/api/v1/payment/status/${encodeURIComponent('ORD-SPECIAL_#001-2026')}`);
    expect(res.status).toBe(200);
    expect(res.body.orderNumber).toBe('ORD-SPECIAL_#001-2026');
  });

  test('B04-T4: Status query immediately after expiration boundary returns EXPIRED', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B04-EXP',
        email: 'exp@test.com',
        totalAmount: 2000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 2000.0 }]
      }
    });

    const sessionId = sessionRes.body.sessionId;
    await context.advanceMockTime(601);

    const res = await request(`/api/v1/payment/session/${sessionId}`);
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('EXPIRED');
  });

  test('B04-T5: Session status enum values are strict and uppercase', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B04-ENUM',
        email: 'enum@test.com',
        totalAmount: 2000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 2000.0 }]
      }
    });

    const validEnums = ['PENDING', 'APPROVED', 'CONFIRMED', 'EXPIRED', 'REJECTED'];
    expect(validEnums.includes(sessionRes.body.status)).toBeTruthy();
  });
});
