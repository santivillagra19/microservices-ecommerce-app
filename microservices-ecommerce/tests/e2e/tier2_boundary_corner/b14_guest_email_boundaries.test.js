/**
 * Tier 2: Boundary & Corner Cases - Feature 14: Guest Email Boundaries
 * Methodology: Equivalence Partitioning & Boundary Value Analysis (BVA)
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Guest Email Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('B14-T1: Accepts single-letter username email (e.g. a@domain.com)', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B14-1',
        email: 'a@domain.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    expect(res.status).toBe(201);
  });

  test('B14-T2: Accepts multi-subdomain email (user@mail.internal.corp.com)', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B14-2',
        email: 'user@mail.internal.corp.com',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    expect(res.status).toBe(201);
  });

  test('B14-T3: Rejects email without "@" sign', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B14-3',
        email: 'plainaddress.without.at.sign',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B14-T4: Rejects email exceeding 255 characters', async () => {
    const hugeEmail = 'x'.repeat(250) + '@domain.com'; // > 260 chars
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B14-4',
        email: hugeEmail,
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_FAILED');
  });

  test('B14-T5: Strips accidental trailing whitespace from email input', async () => {
    const res = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-B14-5',
        email: 'clean.shopper@test.com   ',
        totalAmount: 1000.0,
        items: [{ sku: 'SKU-001', quantity: 1, price: 1000.0 }]
      }
    });

    expect(res.status).toBe(201);
  });
});
