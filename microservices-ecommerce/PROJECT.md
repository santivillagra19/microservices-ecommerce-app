# Project: Microservices E-Commerce Checkout Flow & Payment Service

## Architecture
The platform is a Spring Boot & React distributed e-commerce architecture:
1. **API Gateway** (`api-gateway`, port 9000): Entry point for all client requests; routes `/api/v1/payment/**` to `payment-service` with `permitAll()` for guest checkout, `/api/v1/order/**` to `order-service`, `/api/v1/inventory/**` to `inventory-service`.
2. **Payment Service** (`payment-service`, port 8085): New microservice. Manages checkout sessions (10-minute expiry), processes MercadoPago Sandbox payments (via opaque card tokens from frontend Bricks), processes bank transfer confirmations, provides status query, and acts as the orchestrator for post-payment actions.
3. **Order Service** (`order-service`, port 8082): Maintains order lifecycle (`OrderStatus`: `PLACED`, `PENDING_PAYMENT`, `PAID`, `CONFIRMED`, `CANCELLED`). Updates order status upon payment confirmation.
4. **Inventory Service** (`inventory-service`, port 8083): Manages product stock. Decrements stock quantities for purchased items.
5. **Notification Service** (`notification-service`, port 8084): Listens on RabbitMQ exchange `order-events` (`order.confirmed`) and sends confirmation emails to the buyer.
6. **Frontend UI** (`frontend-ecommerce`): React 19 + TypeScript + Tailwind CSS application. Hosts the checkout page with 10-minute countdown timer, automatic form reset on expiration, guest email input, official MercadoPago CardPayment Brick in sandbox mode, and fictitious bank transfer details.
7. **Infrastructure & K8s** (`K8s/`): Kubernetes deployments and services. `K8s/payment-deployment.yaml` defines the deployment, container port 8085, health probes, and `${MERCADOPAGO_ACCESS_TOKEN}` placeholder.

---

## Feature Inventory
| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Checkout Session Management | Create payment session with 10-minute expiry, unique session ID, order details, and amount | M1 | ORIGINAL_REQUEST §R1 |
| 2 | MercadoPago Sandbox Payment Processing | Process card payment via MP SDK/API using card token from frontend, with test credentials & error handling | M1 | ORIGINAL_REQUEST §R1, §R3 |
| 3 | Bank Transfer Payment Flow | Accept bank transfer confirmation with fictitious account data, mark session as confirmed | M1 | ORIGINAL_REQUEST §R1 |
| 4 | Payment Status Query | Endpoint to query session and payment status by session ID or order ID | M1 | ORIGINAL_REQUEST §R1 |
| 5 | Actuator Health & Microservice Config | Expose `/actuator/health`, Eureka/RabbitMQ integration, consistent Spring Cloud config | M1 | ORIGINAL_REQUEST §R1 |
| 6 | Gateway Routing & Guest Checkout Security | Route `/api/v1/payment/**` via API Gateway, allow unauthenticated guest checkout | M1 | ORIGINAL_REQUEST §R1, §R3 |
| 7 | Secure Sensitive Data Protection | Zero card PAN/CVV storage/logging, MP credentials via env vars only, sanitized inputs, no stack traces | M1 | ORIGINAL_REQUEST §R3 |
| 8 | Kubernetes Manifests | `K8s/payment-deployment.yaml` matching existing manifests with env placeholders | M1 | ORIGINAL_REQUEST §R5 |
| 9 | Order Status Update | Update order status to PAID or CONFIRMED in `order-service` upon successful payment | M2 | ORIGINAL_REQUEST §R4 |
| 10 | Inventory Stock Decrement | Decrement stock in `inventory-service` for all items in the paid order | M2 | ORIGINAL_REQUEST §R4 |
| 11 | Buyer Email Notification | Emit `order.confirmed` event to RabbitMQ `order-events` exchange to trigger `notification-service` email | M2 | ORIGINAL_REQUEST §R4 |
| 12 | 10-Minute Real-Time Countdown Timer | Visible timer counting down from 10:00 to 00:00 in real time on the checkout screen | M3 | ORIGINAL_REQUEST §R2 |
| 13 | Timer Expiration Reset | Automatic reset of all form inputs (email, payment selection, session state) when timer expires | M3 | ORIGINAL_REQUEST §R2 |
| 14 | Guest Checkout by Email | User can complete checkout without logging in, entering only their email | M3 | ORIGINAL_REQUEST §R2 |
| 15 | Official MercadoPago SDK Sandbox Component | Embed MercadoPago CardPayment Brick / SDK in sandbox mode; no custom card input fields | M3 | ORIGINAL_REQUEST §R2, §R3 |
| 16 | Fictitious Bank Transfer Display & Action | Display fictitious Argentine demo account info (CBU, CUIL, Titular) and confirmation button | M3 | ORIGINAL_REQUEST §R2 |
| 17 | Frontend Payment Client & Error Feedback | `paymentService.ts` integration with backend, user-friendly toast notifications | M3 | ORIGINAL_REQUEST §R2, §R3 |
| 18 | Full E2E Test Suite & Adversarial Hardening | Pass 100% of E2E opaque-box tests (Tiers 1-4) and adversarial coverage hardening (Tier 5) | M4 | ORIGINAL_REQUEST Acceptance Criteria |

---

## Milestones
| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | `payment-service` Core, Security & K8s | Implement Spring Boot `payment-service` (sessions, MP sandbox card processing, bank transfer, status, health), security hardening, Gateway route, and K8s manifests | None | IN_PROGRESS |
| M2 | Post-Payment Orchestration | Orchestrate order status update (`order-service`), stock decrement (`inventory-service`), and RabbitMQ event emission for email dispatch (`notification-service`) | M1 | PLANNED |
| M3 | React Checkout UI & MP Sandbox Integration | Refactor `Checkout.tsx` with 10-minute timer, expiration wipe, guest email, MercadoPago CardPayment Brick sandbox, bank transfer demo UI, and API integration | M1 | PLANNED |
| M4 | Final Milestone: 100% E2E Pass & Adversarial Hardening | Verify complete opaque-box E2E test suite (Tiers 1-4) against running/tested services, followed by Tier 5 adversarial coverage hardening | M1, M2, M3 | PLANNED |

---

## Interface Contracts

### 1. Frontend ↔ API Gateway / Payment Service
- **Create Session**:
  `POST /api/v1/payment/session`
  - Request: `{ "orderNumber": "ORD-123", "email": "buyer@example.com", "totalAmount": 15000.00, "currency": "ARS", "items": [{ "sku": "SKU-001", "quantity": 2, "price": 7500.00 }] }`
  - Response (201): `{ "sessionId": "sess_uuid", "orderNumber": "ORD-123", "expiresAt": "2026-09-23T04:30:00Z", "totalAmount": 15000.00, "currency": "ARS", "status": "PENDING" }`
- **Process MercadoPago Card Payment**:
  `POST /api/v1/payment/process`
  - Request: `{ "sessionId": "sess_uuid", "token": "card_token_from_brick", "paymentMethodId": "visa", "installments": 1, "issuerId": "310", "payerEmail": "buyer@example.com" }`
  - Response (200): `{ "paymentId": "mp_123456", "status": "APPROVED", "orderNumber": "ORD-123", "message": "Payment approved successfully" }`
- **Confirm Bank Transfer**:
  `POST /api/v1/payment/bank-transfer/confirm`
  - Request: `{ "sessionId": "sess_uuid" }`
  - Response (200): `{ "paymentId": "bt_uuid", "status": "CONFIRMED", "orderNumber": "ORD-123", "bankDetails": { "cbu": "0000003100010000000001", "cuil": "20-12345678-9", "titular": "Ecommerce Demo S.A." } }`
- **Query Payment Status**:
  `GET /api/v1/payment/session/{sessionId}` or `GET /api/v1/payment/status/{orderNumber}`
  - Response (200): `{ "sessionId": "sess_uuid", "orderNumber": "ORD-123", "status": "APPROVED", "expiresAt": "...", "paymentMethod": "MERCADOPAGO" }`

### 2. Payment Service ↔ Order Service
- `PUT http://order-service:8082/api/v1/order/{orderNumber}/status?status=PAID`
  - Response (200): Updated `OrderResponseDTO` with status `PAID` or `CONFIRMED`.

### 3. Payment Service ↔ Inventory Service
- `PUT http://inventory-service:8083/api/v1/inventory/reduce/{sku}?quantity={quantity}`
  - Response (200): `Stock reduced successfully`.

### 4. Payment Service ↔ Notification Service (via RabbitMQ)
- **Exchange**: `order-events` (TopicExchange)
- **Routing Key**: `order.confirmed`
- **Payload (`OrderConfirmedEvent`)**:
  `{ "orderNumber": "ORD-123", "email": "buyer@example.com" }`
- Consumed by `notification-service` on `notification-confirmed-queue` to dispatch email.

---

## Code Layout
- `microservices-ecommerce/payment-service/`:
  - `pom.xml`: Spring Boot 4.1.0, Java 21, `mercadopago-sdk-java:2.1.29`, RabbitMQ, Actuator, Web, Validation.
  - `src/main/java/com/ecommerce/payment_service/`:
    - `PaymentServiceApplication.java`
    - `config/`: `RabbitMQConfig.java`, `MercadoPagoConfig.java`, `SecurityConfig.java`
    - `controller/`: `PaymentController.java`
    - `dto/`: `PaymentSessionRequest.java`, `PaymentSessionResponse.java`, `CardPaymentRequest.java`, `PaymentResponse.java`, `BankTransferConfirmRequest.java`
    - `model/`: `PaymentSession.java`, `PaymentRecord.java`, `PaymentStatus.java`
    - `repository/`: `PaymentSessionRepository.java`, `PaymentRecordRepository.java`
    - `service/`: `PaymentService.java`, `PostPaymentOrchestrator.java`, `MercadoPagoClient.java`
    - `exception/`: `GlobalExceptionHandler.java`, `SessionExpiredException.java`, `PaymentProcessingException.java`
  - `src/main/resources/`: `application.yml`, `application-k8s.yml`
  - `src/test/java/com/ecommerce/payment_service/`: Unit and integration tests
- `microservices-ecommerce/api-gateway/`:
  - `src/main/resources/application-k8s.yml`, `GatewayConfig.java`, `SecurityConfig.java`: Route and permit `/api/v1/payment/**`.
- `microservices-ecommerce/K8s/`:
  - `payment-deployment.yaml`: Kubernetes Deployment and Service for `payment-service`.
- `frontend-ecommerce/`:
  - `src/pages/Checkout.tsx`: Refactored checkout page.
  - `src/components/checkout/`: `CountdownTimer.tsx`, `MercadoPagoBrick.tsx`, `BankTransferDetails.tsx`
  - `src/services/paymentService.ts`: HTTP client for payment endpoints.
  - `.env`: `VITE_MERCADOPAGO_PUBLIC_KEY`.
- `tests/e2e/`:
  - End-to-end testing suite maintained by the E2E Testing Track.
