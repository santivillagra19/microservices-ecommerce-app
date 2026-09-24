/**
 * Tier 2: Boundary & Corner Cases - Feature 9: Order Status Boundaries
 * Methodology: State Machine Boundaries & Idempotency Testing
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 2 - Boundary: Order Status Boundaries', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('B09-T1: Rejects status update with lowercase status value ("paid" instead of "PAID")', async () => {
    const res = await request('/api/v1/order/ORD-1001/status?status=paid', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('BAD_REQUEST');
  });

  test('B09-T2: Rejects status update with empty status query parameter', async () => {
    const res = await request('/api/v1/order/ORD-1001/status?status=', {
      method: 'PUT'
    });

    expect(res.status).toBe(400);
  });

  test('B09-T3: Updating status to already existing status is idempotent (returns 200 without side effects)', async () => {
    // First update
    const res1 = await request('/api/v1/order/ORD-1001/status?status=PAID', { method: 'PUT' });
    expect(res1.status).toBe(200);

    // Second repeated update
    const res2 = await request('/api/v1/order/ORD-1001/status?status=PAID', { method: 'PUT' });
    expect(res2.status).toBe(200);
    expect(res2.body.status).toBe('PAID');
  });

  test('B09-T4: Handles order numbers with maximum length (64 characters)', async () => {
    const longOrderNumber = 'ORD-' + 'X'.repeat(60);
    const res = await request(`/api/v1/order/${longOrderNumber}/status?status=PAID`, {
      method: 'PUT'
    });

    // 404 because not found, but must not crash with 500
    expect(res.status).toBe(404);
  });

  test('B09-T5: Order state transitions maintain integrity from PLACED to CONFIRMED', async () => {
    const initial = await request('/api/v1/order/ORD-1002');
    expect(initial.body.status).toBe('PLACED');

    await request('/api/v1/order/ORD-1002/status?status=CONFIRMED', { method: 'PUT' });

    const updated = await request('/api/v1/order/ORD-1002');
    expect(updated.body.status).toBe('CONFIRMED');
  });
});
