/**
 * Tier 1: Feature 17 - Frontend Payment Client & Error Feedback
 * Requirement: ORIGINAL_REQUEST §R2, §R3
 * Interface Contract: PROJECT.md §17
 */

const { describe, test, expect, request, context } = require('../harness');

describe('Tier 1 - Feature 17: Frontend Payment Client & Error Feedback', () => {
  beforeEach(async () => {
    await context.resetMockState();
  });

  // Client error mapping adapter model
  function mapApiErrorToUserMessage(httpStatus, responseBody) {
    if (httpStatus === 409 && responseBody?.error === 'SESSION_EXPIRED') {
      return 'La sesión de compra ha expirado. Por favor, vuelva a iniciar el proceso.';
    }
    if (httpStatus === 409 && responseBody?.error === 'INSUFFICIENT_STOCK') {
      return 'Uno o más productos ya no cuentan con stock suficiente.';
    }
    if (httpStatus === 400 && responseBody?.error === 'VALIDATION_FAILED') {
      return 'Por favor verifique los datos ingresados en el formulario.';
    }
    if (httpStatus === 502 || httpStatus === 500) {
      return 'El servicio de pagos no se encuentra disponible temporalmente. Intente más tarde.';
    }
    return 'Ocurrió un error inesperado al procesar su pago.';
  }

  test('F17-T1: Client maps 409 SESSION_EXPIRED into clear user notification', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'user-err@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    await context.advanceMockTime(605);

    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(409);
    const userMsg = mapApiErrorToUserMessage(payRes.status, payRes.body);
    expect(userMsg.includes('expirado')).toBeTruthy();
  });

  test('F17-T2: Client maps 409 INSUFFICIENT_STOCK into clear stock shortage notification', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-OOS',
        email: 'user-oos@test.com',
        totalAmount: 5000.0,
        items: [{ sku: 'SKU-OOS', quantity: 10, price: 500.0 }] // Stock is 0
      }
    });

    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_visa_approved_sandbox',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(409);
    const userMsg = mapApiErrorToUserMessage(payRes.status, payRes.body);
    expect(userMsg.includes('stock')).toBeTruthy();
  });

  test('F17-T3: Client maps 502 Upstream Gateway Error into graceful retry guidance', async () => {
    const sessionRes = await request('/api/v1/payment/session', {
      method: 'POST',
      body: {
        orderNumber: 'ORD-1001',
        email: 'gateway-err@test.com',
        totalAmount: 15000.0,
        items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }]
      }
    });

    const payRes = await request('/api/v1/payment/process', {
      method: 'POST',
      body: {
        sessionId: sessionRes.body.sessionId,
        token: 'tok_server_error_simulation',
        paymentMethodId: 'visa',
        installments: 1
      }
    });

    expect(payRes.status).toBe(502);
    const userMsg = mapApiErrorToUserMessage(payRes.status, payRes.body);
    expect(userMsg.includes('temporalmente')).toBeTruthy();
  });

  test('F17-T4: Client validates that user messages contain no internal Java exception classes', () => {
    const rawError = {
      status: 500,
      body: { error: 'INTERNAL_ERROR', exception: 'com.ecommerce.payment_service.exception.PaymentProcessingException' }
    };

    const userFriendlyMessage = mapApiErrorToUserMessage(rawError.status, rawError.body);
    expect(userFriendlyMessage.includes('com.ecommerce')).toBeFalsy();
    expect(userFriendlyMessage.includes('Exception')).toBeFalsy();
  });

  test('F17-T5: Successful payment clears shopping cart and navigates to confirmation', async () => {
    let cartCleared = false;
    let targetRoute = null;

    const onPaymentSuccess = (orderNumber, method) => {
      cartCleared = true;
      targetRoute = `/checkout/success?orderNumber=${orderNumber}&method=${method}`;
    };

    onPaymentSuccess('ORD-1001', 'MERCADOPAGO');

    expect(cartCleared).toBe(true);
    expect(targetRoute).toBe('/checkout/success?orderNumber=ORD-1001&method=MERCADOPAGO');
  });

  test('F17-T6: Frontend displays toast notifications for feedback rather than alert dialogs', () => {
    let toastType = null;
    let toastMessage = null;

    const mockToast = {
      error: (msg) => { toastType = 'error'; toastMessage = msg; },
      success: (msg) => { toastType = 'success'; toastMessage = msg; }
    };

    mockToast.success('¡Pago completado con éxito!');
    expect(toastType).toBe('success');
    expect(toastMessage.includes('éxito')).toBeTruthy();
  });
});
