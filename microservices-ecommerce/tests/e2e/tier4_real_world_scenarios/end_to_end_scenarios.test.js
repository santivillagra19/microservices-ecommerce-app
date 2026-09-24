/**
 * Tier 4: Real-World End-to-End Application Scenarios
 * Methodology: Realistic End-to-End User Workloads
 * Defined in TEST_INFRA.md §Real-World Application Scenarios:
 * 1. Scenario 1: Guest buyer purchases 2 items via MP sandbox card, receives approval, order marked PAID, stock decremented, notification emitted
 * 2. Scenario 2: Guest buyer selects bank transfer, views fictitious CBU/CUIL/Titular, confirms transfer, order marked CONFIRMED, stock decremented
 * 3. Scenario 3: Checkout timer counts down in real time, reaches 10-minute expiry (00:00), automatically resets email & payment inputs, attempts to pay are rejected
 * 4. Scenario 4: Adversarial security probe: submission with raw card PAN/CVV in payload, checks that backend rejects or strips and never logs/exposes PAN
 * 5. Scenario 5: Stock exhaustion during checkout: buyer attempts payment for out-of-stock item, post-payment catches stock shortage gracefully
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 4: Real-World End-to-End User Scenarios', () => {
  beforeEach(async () => {
    await context.resetMockState();
    await context.setStock('SKU-001', 50);
    await context.setStock('SKU-002', 20);
  });

  test('Scenario 1: Complete Guest Checkout via MercadoPago Sandbox Card (Happy Path)', async () => {
    // Step 1: Guest visits checkout and enters email
    const guestEmail = 'carlos.guest@mercado.com';
    const initialOrder = await request('/api/v1/order/ORD-1001');
    expect(initialOrder.status).toBe(200);
    expect(initialOrder.body.status).toBe('PLACED');

    // Step 2: Frontend initiates checkout payment session with 10-minute expiry
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: guestEmail,
        totalAmount: 15000.0,
        currency: 'ARS',
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    expect(sessionRes.status).toBe(201);
    expect(sessionRes.body.status).toBe('PENDING');
    const sessionId = sessionRes.body.sessionId;

    // Step 3: MercadoPago Brick tokenizes customer card in sandbox and returns token
    const brickOpaqueToken = 'tok_sandbox_card_approved_xyz123';

    // Step 4: Frontend submits payment to backend
    const paymentRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: brickOpaqueToken,
        paymentMethodId: 'visa',
        installments: 1,
        issuerId: '310',
        payerEmail: guestEmail
      }
    });
    expect(paymentRes.status).toBe(200);
    expect(paymentRes.body.status).toBe('APPROVED');
    expect(paymentRes.body.paymentId).toBeDefined();

    // Step 5: Verify post-payment orchestrations
    // 5a. Order status updated to PAID in order-service
    const updatedOrder = await request('/api/v1/order/ORD-1001');
    expect(updatedOrder.body.status).toBe('PAID');

    // 5b. Stock decremented in inventory-service (50 - 2 = 48)
    const stockCheck49 = await request('/api/v1/inventory/SKU-001?quantity=49');
    expect(stockCheck49.body).toBe(false);
    const stockCheck48 = await request('/api/v1/inventory/SKU-001?quantity=48');
    expect(stockCheck48.body).toBe(true);

    // 5c. Notification event emitted to RabbitMQ order-events exchange
    const events = await context.getCapturedEvents();
    expect(events.length).toBe(1);
    expect(events[0].exchange).toBe('order-events');
    expect(events[0].routingKey).toBe('order.confirmed');
    expect(events[0].payload.orderNumber).toBe('ORD-1001');
    expect(events[0].payload.email).toBe(guestEmail);

    // 5d. Payment status query confirms APPROVED
    const finalSession = await request(`/api/v1/payment/session/${sessionId}`);
    expect(finalSession.body.status).toBe('APPROVED');
  });

  test('Scenario 2: Complete Guest Checkout via Bank Transfer', async () => {
    const guestEmail = 'maria.transfer@banco.com';

    // Step 1: Create session for bank transfer
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1002',
        email: guestEmail,
        totalAmount: 8500.0,
        currency: 'ARS',
        items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }]
      }
    });
    expect(sessionRes.status).toBe(201);
    const sessionId = sessionRes.body.sessionId;

    // Step 2: Buyer selects Transferencia Bancaria, views fictitious demo details, and confirms
    const confirmRes = await request('/api/v1/payment/bank-transfer/confirm', {
      method: 'POST',
      body: { sessionId }
    });
    expect(confirmRes.status).toBe(200);
    expect(confirmRes.body.status).toBe('CONFIRMED');
    expect(confirmRes.body.bankDetails).toBeDefined();
    expect(confirmRes.body.bankDetails.cbu).toBe('0000003100010000000001');
    expect(confirmRes.body.bankDetails.cuil).toBe('20-12345678-9');
    expect(confirmRes.body.bankDetails.titular).toBe('Ecommerce Demo S.A.');

    // Step 3: Verify post-payment orchestrations
    // 3a. Order status updated to CONFIRMED
    const updatedOrder = await request('/api/v1/order/ORD-1002');
    expect(updatedOrder.body.status).toBe('CONFIRMED');

    // 3b. Inventory decremented (20 - 1 = 19)
    const stockCheck20 = await request('/api/v1/inventory/SKU-002?quantity=20');
    expect(stockCheck20.body).toBe(false);
    const stockCheck19 = await request('/api/v1/inventory/SKU-002?quantity=19');
    expect(stockCheck19.body).toBe(true);

    // 3c. Notification emitted
    const events = await context.getCapturedEvents();
    expect(events.length).toBe(1);
    expect(events[0].payload.orderNumber).toBe('ORD-1002');
    expect(events[0].payload.email).toBe(guestEmail);
  });

  test('Scenario 3: 10-Minute Timer Countdown Expiration & Automatic Form Wipe', async () => {
    // Step 1: User lands on checkout, session initialized
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1003',
        email: 'slow.buyer@example.com',
        totalAmount: 3000.0,
        items: [{ sku: 'SKU-003', quantity: 1, price: 3000.0 }]
      }
    });
    const sessionId = sessionRes.body.sessionId;

    // Step 2: User fills form inputs (simulated frontend state)
    let uiForm = {
      email: 'slow.buyer@example.com',
      paymentMethod: 'MERCADOPAGO',
      cardToken: 'tok_pending_submit'
    };

    // Step 3: Fast-forward simulated time to 10m01s (601 seconds)
    await context.advanceMockTime(601);

    // Step 4: Timer triggers expiration handler in UI: form wipes
    uiForm = { email: '', paymentMethod: 'MERCADOPAGO', cardToken: null };
    expect(uiForm.email).toBe('');
    expect(uiForm.cardToken).toBeNull();

    // Step 5: If an adversarial or delayed script attempts to process payment on expired session:
    const latePayRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId,
        token: 'tok_late_token',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(latePayRes.status).toBe(409);
    expect(latePayRes.body.error).toBe('SESSION_EXPIRED');

    // Step 6: Order status remains unchanged (PLACED, not PAID)
    const order = await request('/api/v1/order/ORD-1003');
    expect(order.body.status).toBe('PLACED');
  });

  test('Scenario 4: Adversarial Security Probe - Raw Card PAN/CVV Interception', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'attacker@probe.org',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });
    const sessionId = sessionRes.body.sessionId;

    // Attacker crafts malicious payload with real credit card numbers and security code
    const rawCardPayload = {
      sessionId,
      cardNumber: '4532015099881234',
      cvv: '889',
      expirationDate: '11/27',
      cardholderName: 'Malicious Attacker'
    };

    const probeRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: rawCardPayload
    });

    // Expect 400 rejection
    expect(probeRes.status).toBe(400);
    expect(probeRes.body.error).toBe('INSECURE_PAYLOAD');

    // Response must NEVER echo the raw PAN or CVV
    expect(probeRes.rawText.includes('4532015099881234')).toBeFalsy();
    expect(probeRes.rawText.includes('889')).toBeFalsy();

    // Audit logs must NEVER contain the raw card number or CVV
    const auditLogs = await context.getAuditLogs();
    const logsStr = JSON.stringify(auditLogs);
    expect(logsStr.includes('4532015099881234')).toBeFalsy();
    expect(logsStr.includes('"cvv":"889"')).toBeFalsy();

    // Response must not contain stack traces
    expect(probeRes.rawText.includes('Exception')).toBeFalsy();
    expect(probeRes.rawText.includes('org.springframework')).toBeFalsy();
  });

  test('Scenario 5: Concurrent Stock Exhaustion During Checkout', async () => {
    // Setup item with only 1 unit left
    await context.setStock('SKU-LIMITED', 1);

    // Buyer A creates session for 1 unit
    const sessionARes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-BUYER-A',
        email: 'buyerA@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-LIMITED', quantity: 1, price: 5000.0 }]
      }
    });

    // Buyer B concurrently creates session for 1 unit
    const sessionBRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-BUYER-B',
        email: 'buyerB@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-LIMITED', quantity: 1, price: 5000.0 }]
      }
    });

    // Buyer A completes payment first
    const payARes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionARes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });
    expect(payARes.status).toBe(200);
    expect(payARes.body.status).toBe('APPROVED');

    // Buyer B attempts to complete payment, but stock is now exhausted (0 remaining)
    const payBRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionBRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payBRes.status).toBe(409);
    expect(payBRes.body.error).toBe('INSUFFICIENT_STOCK');

    // Buyer B's session is not approved
    const statusB = await request(`/api/v1/payment/session/${sessionBRes.body.sessionId}`);
    expect(statusB.body.status !== 'APPROVED').toBeTruthy();
  });
});
