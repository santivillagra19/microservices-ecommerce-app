/**
 * Tier 1: Feature 5 - Actuator Health & Microservice Config
 * Requirement: ORIGINAL_REQUEST §R1, Acceptance Criteria
 * Interface Contract: PROJECT.md §1, TEST_INFRA.md
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 5: Actuator Health & Microservice Config', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F5-T1: GET /actuator/health returns 200 OK with status UP', async () => {
    const res = await request('/actuator/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('UP');
  });

  test('F5-T2: Health response includes diskSpace and ping status components', async () => {
    const res = await request('/actuator/health');
    expect(res.status).toBe(200);
    expect(res.body.components).toBeDefined();
    expect(res.body.components.diskSpace).toBeDefined();
    expect(res.body.components.diskSpace.status).toBe('UP');
    expect(res.body.components.ping.status).toBe('UP');
  });

  test('F5-T3: Health response includes RabbitMQ connectivity component status', async () => {
    const res = await request('/actuator/health');
    expect(res.status).toBe(200);
    expect(res.body.components.rabbitmq).toBeDefined();
    expect(res.body.components.rabbitmq.status).toBe('UP');
  });

  test('F5-T4: GET /actuator/metrics exposes core operational metric names', async () => {
    const res = await request('/actuator/metrics');
    expect(res.status).toBe(200);
    expect(res.body.names).toBeDefined();
    expect(Array.isArray(res.body.names)).toBeTruthy();
    expect(res.body.names.includes('jvm.memory.used')).toBeTruthy();
  });

  test('F5-T5: Restricted management endpoints like /actuator/env are protected/unauthorized', async () => {
    const res = await request('/actuator/env');
    expect(res.status).toBe(401);
  });

  test('F5-T6: Health check returns 503 DOWN when critical infrastructure fails', async () => {
    // Simulate broker or DB outage
    await request('/__mock/toggle-health', {
      method: 'POST',
      body: { down: true }
    });

    const res = await request('/actuator/health');
    expect(res.status).toBe(503);
    expect(res.body.status).toBe('DOWN');
  });
});
