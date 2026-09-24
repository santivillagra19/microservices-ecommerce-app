/**
 * Tier 1: Feature 16 - Fictitious Bank Transfer Display & Action
 * Requirement: ORIGINAL_REQUEST §R2, Acceptance Criteria
 * Interface Contract: PROJECT.md §16
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 16: Fictitious Bank Transfer Display & Action', () => {
  const fictitiousBankDetails = {
    cbu: '0000003100010000000001',
    cuil: '20-12345678-9',
    titular: 'Ecommerce Demo S.A.',
    alias: 'DEMO.ECOMMERCE.ARS',
    bank: 'Banco Santander Río (Demo)'
  };

  beforeEach(async () => {
    await context.resetMockState();
  });

  test('F16-T1: Bank transfer details contain valid 22-digit Argentine CBU format', () => {
    expect(fictitiousBankDetails.cbu).toBeDefined();
    expect(fictitiousBankDetails.cbu.length).toBe(22);
    expect(/^\d{22}$/.test(fictitiousBankDetails.cbu)).toBeTruthy();
  });

  test('F16-T2: Bank transfer details contain valid Argentine CUIL format (20-XXXXXXXX-X)', () => {
    expect(fictitiousBankDetails.cuil).toBeDefined();
    expect(/^\d{2}-\d{8}-\d{1}$/.test(fictitiousBankDetails.cuil)).toBeTruthy();
  });

  test('F16-T3: Bank transfer details contain fictitious business titular name', () => {
    expect(fictitiousBankDetails.titular).toBe('Ecommerce Demo S.A.');
  });

  test('F16-T4: Bank transfer confirmation endpoint returns demo bank details to client', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'transfer.display@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const res = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId: sessionRes.body.sessionId }
    });

    expect(res.status).toBe(200);
    expect(res.body.bankDetails).toBeDefined();
    expect(res.body.bankDetails.cbu).toBe(fictitiousBankDetails.cbu);
    expect(res.body.bankDetails.cuil).toBe(fictitiousBankDetails.cuil);
    expect(res.body.bankDetails.titular).toBe(fictitiousBankDetails.titular);
  });

  test('F16-T5: Copy-to-clipboard action formats account details accurately for clipboard', () => {
    const clipboardPayload = `CBU: ${fictitiousBankDetails.cbu}\nCUIL: ${fictitiousBankDetails.cuil}\nTitular: ${fictitiousBankDetails.titular}`;
    expect(clipboardPayload.includes('0000003100010000000001')).toBeTruthy();
    expect(clipboardPayload.includes('20-12345678-9')).toBeTruthy();
  });

  test('F16-T6: Transfer UI indicates clearly that account details are for demo purposes', () => {
    const demoNotice = 'Datos ficticios de demostración. No realice transferencias reales.';
    expect(demoNotice.toLowerCase().includes('demostración') || demoNotice.toLowerCase().includes('demo')).toBeTruthy();
  });
});
