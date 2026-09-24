/**
 * High-Fidelity Mock Server for E2E Opaque-Box Testing
 * Implements exact contracts from PROJECT.md, ORIGINAL_REQUEST.md, and TEST_INFRA.md:
 * - Payment Service (port 8085 / gateway 9000): sessions, MP sandbox card processing, bank transfer, status query, health
 * - Order Service (port 8082): order status updates
 * - Inventory Service (port 8083): stock decrement
 * - RabbitMQ Event Bus simulation: captures order.confirmed events on order-events exchange
 * - Security & Audit Logging: guarantees no card PAN/CVV storage or leakage
 */

const http = require('http');
const { randomUUID } = require('crypto');

class MockMicroservicesServer {
  constructor(port = 18085) {
    this.port = port;
    this.server = null;
    this.simulatedTimeOffsetMs = 0;
    this.resetState();
  }

  resetState() {
    this.simulatedTimeOffsetMs = 0;
    this.sessions = new Map();
    this.orders = new Map([
      ['ORD-1001', { orderNumber: 'ORD-1001', status: 'PLACED', email: 'customer@example.com', totalAmount: 15000.0, items: [{ sku: 'SKU-001', quantity: 2, price: 7500.0 }] }],
      ['ORD-1002', { orderNumber: 'ORD-1002', status: 'PLACED', email: 'guest@shop.com', totalAmount: 8500.0, items: [{ sku: 'SKU-002', quantity: 1, price: 8500.0 }] }],
      ['ORD-1003', { orderNumber: 'ORD-1003', status: 'PLACED', email: 'buyer3@test.com', totalAmount: 3000.0, items: [{ sku: 'SKU-003', quantity: 1, price: 3000.0 }] }],
      ['ORD-OOS', { orderNumber: 'ORD-OOS', status: 'PLACED', email: 'oos@example.com', totalAmount: 5000.0, items: [{ sku: 'SKU-OOS', quantity: 10, price: 500.0 }] }],
      ['ORD-CANCELLED', { orderNumber: 'ORD-CANCELLED', status: 'CANCELLED', email: 'cancelled@test.com', totalAmount: 2000.0, items: [] }]
    ]);

    this.inventory = new Map([
      ['SKU-001', 50],
      ['SKU-002', 20],
      ['SKU-003', 15],
      ['SKU-OOS', 0],
      ['SKU-LOW', 2]
    ]);

    this.capturedEvents = [];
    this.auditLogs = [];
    this.requestLogs = [];
    this.forceHealthDown = false;
  }

  now() {
    return new Date(Date.now() + this.simulatedTimeOffsetMs);
  }

  advanceTime(seconds) {
    this.simulatedTimeOffsetMs += seconds * 1000;
  }

  logAudit(level, message, metadata = {}) {
    // Strictly sanitize any PAN or CVV before recording in audit logs
    const sanitizedMeta = JSON.parse(JSON.stringify(metadata, (key, value) => {
      if (/card|pan|cvv|securityCode|number/i.test(key) && typeof value === 'string' && value.length > 4) {
        return '***MASKED***';
      }
      return value;
    }));
    this.auditLogs.push({ timestamp: this.now().toISOString(), level, message, metadata: sanitizedMeta });
  }

  async start() {
    return new Promise((resolve, reject) => {
      this.server = http.createServer((req, res) => this.handleRequest(req, res));
      this.server.listen(this.port, () => {
        resolve(this.port);
      });
      this.server.on('error', reject);
    });
  }

  async stop() {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => resolve());
      } else {
        resolve();
      }
    });
  }

  async parseBody(req) {
    return new Promise((resolve) => {
      let body = '';
      req.on('data', chunk => { body += chunk; });
      req.on('end', () => {
        if (!body) return resolve({});
        try {
          resolve(JSON.parse(body));
        } catch {
          resolve(body);
        }
      });
    });
  }

  sendJson(res, statusCode, data, customHeaders = {}) {
    const payload = JSON.stringify(data);
    res.writeHead(statusCode, {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      ...customHeaders
    });
    res.end(payload);
  }

  sendText(res, statusCode, text) {
    res.writeHead(statusCode, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Access-Control-Allow-Origin': '*'
    });
    res.end(text);
  }

  async handleRequest(req, res) {
    const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = url.pathname;
    const method = req.method;

    // CORS preflight
    if (method === 'OPTIONS') {
      res.writeHead(204, {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400'
      });
      return res.end();
    }

    const body = ['POST', 'PUT', 'PATCH'].includes(method) ? await this.parseBody(req) : {};
    this.requestLogs.push({ method, pathname, query: Object.fromEntries(url.searchParams), body });

    // Internal Mock Control Endpoints
    if (pathname === '/__mock/reset' && method === 'POST') {
      this.resetState();
      return this.sendJson(res, 200, { status: 'RESET_OK' });
    }
    if (pathname === '/__mock/advance-time' && method === 'POST') {
      const seconds = Number(body.seconds) || 0;
      this.advanceTime(seconds);
      return this.sendJson(res, 200, { currentNow: this.now().toISOString(), offsetSeconds: this.simulatedTimeOffsetMs / 1000 });
    }
    if (pathname === '/__mock/events' && method === 'GET') {
      return this.sendJson(res, 200, this.capturedEvents);
    }
    if (pathname === '/__mock/audit-logs' && method === 'GET') {
      return this.sendJson(res, 200, this.auditLogs);
    }
    if (pathname === '/__mock/set-stock' && method === 'POST') {
      this.inventory.set(body.sku, Number(body.quantity));
      return this.sendJson(res, 200, { sku: body.sku, quantity: this.inventory.get(body.sku) });
    }
    if (pathname.startsWith('/__mock/order/') && method === 'GET') {
      const orderNumber = pathname.replace('/__mock/order/', '');
      return this.sendJson(res, 200, this.orders.get(orderNumber) || null);
    }
    if (pathname === '/__mock/toggle-health' && method === 'POST') {
      this.forceHealthDown = !!body.down;
      return this.sendJson(res, 200, { forceHealthDown: this.forceHealthDown });
    }

    // 1. Actuator Health
    if (pathname === '/actuator/health' && method === 'GET') {
      if (this.forceHealthDown) {
        return this.sendJson(res, 503, {
          status: 'DOWN',
          components: {
            diskSpace: { status: 'UP' },
            ping: { status: 'UP' },
            rabbitmq: { status: 'DOWN', details: { error: 'Connection refused' } }
          }
        });
      }
      return this.sendJson(res, 200, {
        status: 'UP',
        components: {
          diskSpace: { status: 'UP', details: { total: 10737418240, free: 5368709120 } },
          ping: { status: 'UP' },
          rabbitmq: { status: 'UP', details: { version: '3.12.0' } },
          db: { status: 'UP', details: { database: 'PostgreSQL' } }
        }
      });
    }

    // 2. Actuator Metrics
    if (pathname === '/actuator/metrics' && method === 'GET') {
      return this.sendJson(res, 200, {
        names: ['jvm.memory.used', 'http.server.requests', 'process.uptime']
      });
    }

    // Protected Actuator Endpoint Lockdown Test
    if (['/actuator/env', '/actuator/heapdump', '/actuator/shutdown'].includes(pathname)) {
      return this.sendJson(res, 401, { error: 'Unauthorized', message: 'Actuator management endpoint is restricted' });
    }

    // 3. Payment Service: Create Session (POST /api/v1/payment/session)
    if (pathname === '/api/v1/payment/session' && method === 'POST') {
      const { orderNumber, email, totalAmount, currency, items } = body;

      // Validation
      if (!orderNumber || typeof orderNumber !== 'string' || !orderNumber.trim()) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Order number is required' });
      }
      if (!email || typeof email !== 'string' || !email.includes('@') || email.length > 255) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Valid email address is required' });
      }
      if (typeof totalAmount !== 'number' || totalAmount <= 0 || isNaN(totalAmount)) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Total amount must be greater than zero' });
      }
      if (!items || !Array.isArray(items) || items.length === 0) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Items list cannot be empty' });
      }

      // Check item validity
      for (const item of items) {
        if (!item.sku || !item.quantity || item.quantity <= 0 || item.price === undefined || item.price < 0) {
          return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Each item must have a valid sku, positive quantity, and non-negative price' });
        }
      }

      const sessionId = 'sess_' + randomUUID();
      const expiresAt = new Date(this.now().getTime() + 10 * 60 * 1000).toISOString();
      const session = {
        sessionId,
        orderNumber,
        email: email.trim(),
        totalAmount,
        currency: currency || 'ARS',
        items,
        status: 'PENDING',
        createdAt: this.now().toISOString(),
        expiresAt,
        paymentMethod: null,
        paymentId: null
      };

      this.sessions.set(sessionId, session);
      this.logAudit('INFO', 'Payment session created', { sessionId, orderNumber, totalAmount });

      return this.sendJson(res, 201, {
        sessionId,
        orderNumber,
        expiresAt,
        totalAmount,
        currency: session.currency,
        status: 'PENDING'
      });
    }

    // 4. Payment Service: Process MercadoPago Card Payment (POST /api/v1/payment/process)
    if (pathname === '/api/v1/payment/process' && method === 'POST') {
      // Security Inspection: Detect if raw PAN / CVV is passed
      if (body.cardNumber || body.pan || body.cvv || body.securityCode) {
        this.logAudit('WARN', 'Rejected raw card data payload attempt from client', { cardNumber: body.cardNumber || body.pan || '***', hasCardNumber: true });
        return this.sendJson(res, 400, {
          error: 'INSECURE_PAYLOAD',
          message: 'Direct card PAN/CVV submission is strictly forbidden. Use MercadoPago Brick SDK token.'
        });
      }

      const { sessionId, token, paymentMethodId, installments, issuerId, payerEmail } = body;

      if (!sessionId) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Session ID is required' });
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return this.sendJson(res, 404, { error: 'SESSION_NOT_FOUND', message: 'Checkout session not found' });
      }

      // Expiration check
      if (new Date(this.now()) >= new Date(session.expiresAt)) {
        session.status = 'EXPIRED';
        return this.sendJson(res, 409, {
          error: 'SESSION_EXPIRED',
          message: 'Checkout session has expired. Please initiate a new checkout.'
        });
      }

      // Check if already completed
      if (['APPROVED', 'CONFIRMED'].includes(session.status)) {
        return this.sendJson(res, 409, {
          error: 'ALREADY_PAID',
          message: 'Session has already been processed and paid'
        });
      }

      // Validate token
      if (!token || typeof token !== 'string' || token.trim().length === 0) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'MercadoPago card token is required' });
      }

      // Installments validation
      const inst = installments !== undefined ? Number(installments) : 1;
      if (isNaN(inst) || inst < 1 || inst > 12) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Installments must be between 1 and 12' });
      }

      // Simulate MercadoPago Sandbox responses based on token values
      if (token.includes('insufficient_funds') || token.includes('cc_rejected_insufficient_amount')) {
        const paymentId = 'mp_rej_' + randomUUID().substring(0, 8);
        session.status = 'REJECTED';
        this.logAudit('INFO', 'Payment rejected by MercadoPago Sandbox: insufficient funds', { sessionId, paymentId });
        return this.sendJson(res, 200, {
          paymentId,
          status: 'REJECTED',
          orderNumber: session.orderNumber,
          message: 'cc_rejected_insufficient_amount'
        });
      }

      if (token.includes('bad_security_code') || token.includes('cc_rejected_bad_filled_security_code')) {
        const paymentId = 'mp_rej_' + randomUUID().substring(0, 8);
        session.status = 'REJECTED';
        return this.sendJson(res, 200, {
          paymentId,
          status: 'REJECTED',
          orderNumber: session.orderNumber,
          message: 'cc_rejected_bad_filled_security_code'
        });
      }

      if (token === 'tok_server_error_simulation') {
        return this.sendJson(res, 502, {
          error: 'MERCADOPAGO_GATEWAY_ERROR',
          message: 'Upstream payment processor temporarily unavailable'
        });
      }

      // Stock pre-check before completing payment
      for (const item of session.items) {
        const currentStock = this.inventory.get(item.sku) ?? 0;
        if (currentStock < item.quantity) {
          return this.sendJson(res, 409, {
            error: 'INSUFFICIENT_STOCK',
            message: `Product ${item.sku} is out of stock or insufficient quantity`
          });
        }
      }

      // Payment Approved
      const paymentId = 'mp_' + randomUUID().substring(0, 10);
      session.status = 'APPROVED';
      session.paymentMethod = 'MERCADOPAGO';
      session.paymentId = paymentId;

      // Post-Payment Orchestrations:
      // 1. Decrement Inventory
      for (const item of session.items) {
        const currentStock = this.inventory.get(item.sku) ?? 0;
        this.inventory.set(item.sku, currentStock - item.quantity);
      }

      // 2. Update Order Status
      const order = this.orders.get(session.orderNumber);
      if (order) {
        order.status = 'PAID';
      }

      // 3. Emit RabbitMQ event to order-events exchange
      const eventPayload = {
        orderNumber: session.orderNumber,
        email: session.email || payerEmail || 'guest@example.com'
      };
      this.capturedEvents.push({
        exchange: 'order-events',
        routingKey: 'order.confirmed',
        payload: eventPayload,
        timestamp: this.now().toISOString()
      });

      this.logAudit('INFO', 'Payment approved and post-payment orchestration succeeded', {
        sessionId,
        orderNumber: session.orderNumber,
        paymentId
      });

      return this.sendJson(res, 200, {
        paymentId,
        status: 'APPROVED',
        orderNumber: session.orderNumber,
        message: 'Payment approved successfully'
      });
    }

    // 5. Payment Service: Bank Transfer Confirmation (POST /api/v1/payment/bank-transfer/confirm)
    if (pathname === '/api/v1/payment/bank-transfer/confirm' && method === 'POST') {
      const { sessionId } = body;
      if (!sessionId) {
        return this.sendJson(res, 400, { error: 'VALIDATION_FAILED', message: 'Session ID is required' });
      }

      const session = this.sessions.get(sessionId);
      if (!session) {
        return this.sendJson(res, 404, { error: 'SESSION_NOT_FOUND', message: 'Checkout session not found' });
      }

      if (new Date(this.now()) >= new Date(session.expiresAt)) {
        session.status = 'EXPIRED';
        return this.sendJson(res, 409, {
          error: 'SESSION_EXPIRED',
          message: 'Checkout session has expired'
        });
      }

      if (['APPROVED', 'CONFIRMED'].includes(session.status)) {
        return this.sendJson(res, 409, {
          error: 'ALREADY_PAID',
          message: 'Session has already been confirmed'
        });
      }

      // Stock pre-check
      for (const item of session.items) {
        const currentStock = this.inventory.get(item.sku) ?? 0;
        if (currentStock < item.quantity) {
          return this.sendJson(res, 409, {
            error: 'INSUFFICIENT_STOCK',
            message: `Product ${item.sku} is out of stock`
          });
        }
      }

      const paymentId = 'bt_' + randomUUID().substring(0, 10);
      const bankDetails = {
        cbu: '0000003100010000000001',
        cuil: '20-12345678-9',
        titular: 'Ecommerce Demo S.A.'
      };

      session.status = 'CONFIRMED';
      session.paymentMethod = 'BANK_TRANSFER';
      session.paymentId = paymentId;
      session.bankDetails = bankDetails;

      // Decrement inventory
      for (const item of session.items) {
        const currentStock = this.inventory.get(item.sku) ?? 0;
        this.inventory.set(item.sku, currentStock - item.quantity);
      }

      // Update Order Status
      const order = this.orders.get(session.orderNumber);
      if (order) {
        order.status = 'CONFIRMED';
      }

      // Emit RabbitMQ event
      this.capturedEvents.push({
        exchange: 'order-events',
        routingKey: 'order.confirmed',
        payload: {
          orderNumber: session.orderNumber,
          email: session.email
        },
        timestamp: this.now().toISOString()
      });

      return this.sendJson(res, 200, {
        paymentId,
        status: 'CONFIRMED',
        orderNumber: session.orderNumber,
        bankDetails
      });
    }

    // 6. Payment Service: Query Session Status (GET /api/v1/payment/session/:sessionId)
    if (pathname.startsWith('/api/v1/payment/session/') && method === 'GET') {
      const sessionId = decodeURIComponent(pathname.replace('/api/v1/payment/session/', ''));
      const session = this.sessions.get(sessionId);
      if (!session) {
        return this.sendJson(res, 404, { error: 'NOT_FOUND', message: 'Session not found' });
      }

      // Dynamically evaluate expiration if still pending
      let currentStatus = session.status;
      if (currentStatus === 'PENDING' && new Date(this.now()) >= new Date(session.expiresAt)) {
        currentStatus = 'EXPIRED';
        session.status = 'EXPIRED';
      }

      return this.sendJson(res, 200, {
        sessionId: session.sessionId,
        orderNumber: session.orderNumber,
        status: currentStatus,
        expiresAt: session.expiresAt,
        paymentMethod: session.paymentMethod,
        totalAmount: session.totalAmount,
        currency: session.currency
      });
    }

    // 7. Payment Service: Query Payment Status by Order (GET /api/v1/payment/status/:orderNumber)
    if (pathname.startsWith('/api/v1/payment/status/') && method === 'GET') {
      const orderNumber = decodeURIComponent(pathname.replace('/api/v1/payment/status/', ''));
      const session = Array.from(this.sessions.values()).find(s => s.orderNumber === orderNumber);
      if (!session) {
        return this.sendJson(res, 404, { error: 'NOT_FOUND', message: 'Payment record for order not found' });
      }

      let currentStatus = session.status;
      if (currentStatus === 'PENDING' && new Date(this.now()) >= new Date(session.expiresAt)) {
        currentStatus = 'EXPIRED';
        session.status = 'EXPIRED';
      }

      return this.sendJson(res, 200, {
        sessionId: session.sessionId,
        orderNumber: session.orderNumber,
        status: currentStatus,
        expiresAt: session.expiresAt,
        paymentMethod: session.paymentMethod
      });
    }

    // 8. Order Service: Update Order Status (PUT /api/v1/order/:orderNumber/status)
    if (pathname.match(/^\/api\/v1\/order\/[^/]+\/status$/) && method === 'PUT') {
      const parts = pathname.split('/');
      const orderNumber = parts[4];
      const newStatus = url.searchParams.get('status');

      const order = this.orders.get(orderNumber);
      if (!order) {
        return this.sendJson(res, 404, { error: 'RESOURCE_NOT_FOUND', message: `Order ${orderNumber} not found` });
      }

      const validStatuses = ['PLACED', 'PENDING_PAYMENT', 'PAID', 'CONFIRMED', 'CANCELLED'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        return this.sendJson(res, 400, { error: 'BAD_REQUEST', message: `Invalid status: ${newStatus}` });
      }

      order.status = newStatus;
      return this.sendJson(res, 200, {
        orderNumber: order.orderNumber,
        status: order.status,
        email: order.email,
        totalAmount: order.totalAmount
      });
    }

    // 9. Order Service: Get Order (GET /api/v1/order/:orderNumber)
    if (pathname.match(/^\/api\/v1\/order\/[^/]+$/) && method === 'GET') {
      const orderNumber = pathname.split('/')[4];
      const order = this.orders.get(orderNumber);
      if (!order) {
        return this.sendJson(res, 404, { error: 'RESOURCE_NOT_FOUND', message: 'Order not found' });
      }
      return this.sendJson(res, 200, order);
    }

    // 10. Inventory Service: Reduce Stock (PUT /api/v1/inventory/reduce/:sku)
    if (pathname.startsWith('/api/v1/inventory/reduce/') && method === 'PUT') {
      const sku = pathname.replace('/api/v1/inventory/reduce/', '');
      const quantityStr = url.searchParams.get('quantity');
      const quantity = quantityStr !== null ? Number(quantityStr) : 1;

      if (isNaN(quantity) || quantity <= 0) {
        return this.sendJson(res, 400, { error: 'BAD_REQUEST', message: 'Quantity must be positive' });
      }

      if (!this.inventory.has(sku)) {
        return this.sendJson(res, 404, { error: 'NOT_FOUND', message: `SKU ${sku} not found in inventory` });
      }

      const currentStock = this.inventory.get(sku);
      if (currentStock < quantity) {
        return this.sendJson(res, 400, { error: 'INSUFFICIENT_STOCK', message: `Cannot reduce ${quantity}, current stock is ${currentStock}` });
      }

      this.inventory.set(sku, currentStock - quantity);
      return this.sendText(res, 200, 'Stock reducido exitosamente');
    }

    // 11. Inventory Service: Check Stock (GET /api/v1/inventory/:sku)
    if (pathname.match(/^\/api\/v1\/inventory\/[^/]+$/) && method === 'GET') {
      const sku = pathname.replace('/api/v1/inventory/', '');
      const quantity = Number(url.searchParams.get('quantity') || '1');
      if (!this.inventory.has(sku)) {
        return this.sendJson(res, 200, false);
      }
      const stock = this.inventory.get(sku);
      return this.sendJson(res, 200, stock >= quantity);
    }

    // Unmatched route
    return this.sendJson(res, 404, { error: 'NOT_FOUND', message: `Route ${method} ${pathname} not found` });
  }
}

module.exports = { MockMicroservicesServer };

if (require.main === module) {
  const port = Number(process.env.PORT) || 18085;
  const server = new MockMicroservicesServer(port);
  server.start().then(() => {
    console.log(`Mock Microservices Server running on port ${port}`);
  });
}
