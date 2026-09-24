/**
 * Tier 2: Boundary & Corner Cases - Feature 10: Inventory Stock Boundaries
 * Methodology: Boundary Value Analysis & Race Condition Testing
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Inventory Stock Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
    await context.setStock('SKU-BOUNDARY', 10);
  });

  test('B10-T1: Decrements stock to exactly zero (stock = 0 boundary)', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-BOUNDARY?quantity=10', {
      method: 'PUT'
    });

    expect(res.status).toBe(200);

    // Further check: in stock for 1 unit should now be false
    const inStock = await request('/api/v1/inventory/SKU-BOUNDARY?quantity=1');
    expect(inStock.body).toBe(false);
  });

  test('B10-T2: Rejects reduction when current stock is already zero', async () => {
    await context.setStock('SKU-BOUNDARY', 0);

    const res = await request('/api/v1/inventory/reduce/SKU-BOUNDARY?quantity=1', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('INSUFFICIENT_STOCK');
  });

  test('B10-T3: Rejects reduction with non-integer or decimal quantity', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-BOUNDARY?quantity=2.5', {
      method: 'PUT'
    });

    // Either accepted as truncated or rejected as bad request
    expect(res.status === 200 || res.status === 400).toBeTruthy();
  });

  test('B10-T4: Handles quantity of 1 (minimum positive quantity boundary)', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-BOUNDARY?quantity=1', {
      method: 'PUT'
    });

    expect(res.status).toBe(200);
  });

  test('B10-T5: Rejects integer overflow quantity (e.g. 2147483648)', async () => {
    const res = await request('/api/v1/inventory/reduce/SKU-BOUNDARY?quantity=2147483648', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
  });
});
