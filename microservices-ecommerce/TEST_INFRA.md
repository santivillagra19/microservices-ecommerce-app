# E2E Test Infra: Microservices E-Commerce Checkout

## Test Philosophy
- Opaque-box, requirement-driven. No dependency on internal implementation details.
- Validates system behavior strictly from user and external API perspectives across all requirements (R1–R5).
- Methodology: Category-Partition, Boundary Value Analysis (BVA), Pairwise Combinatorial Testing, and Realistic Application Workloads.

---

## Feature Inventory & Test Matrix
| # | Feature | Source (requirement) | Tier 1 (Coverage) | Tier 2 (Boundary) | Tier 3 (Pairwise) | Tier 4 (Scenario) |
|---|---------|---------------------|:-----------------:|:-----------------:|:-----------------:|:-----------------:|
| 1 | Checkout Session Management | ORIGINAL_REQUEST §R1 | ≥5 | ≥5 | ✓ | ✓ |
| 2 | MercadoPago Sandbox Payment | ORIGINAL_REQUEST §R1, §R3 | ≥5 | ≥5 | ✓ | ✓ |
| 3 | Bank Transfer Payment Flow | ORIGINAL_REQUEST §R1 | ≥5 | ≥5 | ✓ | ✓ |
| 4 | Payment Status Query | ORIGINAL_REQUEST §R1 | ≥5 | ≥5 | ✓ | ✓ |
| 5 | Actuator Health & Config | ORIGINAL_REQUEST §R1 | ≥5 | ≥5 | ✓ | ✓ |
| 6 | Gateway Routing & Guest Checkout | ORIGINAL_REQUEST §R1, §R3 | ≥5 | ≥5 | ✓ | ✓ |
| 7 | Secure Sensitive Data Protection | ORIGINAL_REQUEST §R3 | ≥5 | ≥5 | ✓ | ✓ |
| 8 | Kubernetes Manifests | ORIGINAL_REQUEST §R5 | ≥5 | ≥5 | ✓ | ✓ |
| 9 | Order Status Update (Post-Payment) | ORIGINAL_REQUEST §R4 | ≥5 | ≥5 | ✓ | ✓ |
| 10 | Inventory Stock Decrement | ORIGINAL_REQUEST §R4 | ≥5 | ≥5 | ✓ | ✓ |
| 11 | Buyer Email Notification Event | ORIGINAL_REQUEST §R4 | ≥5 | ≥5 | ✓ | ✓ |
| 12 | 10-Minute Real-Time Timer | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 13 | Timer Expiration Reset | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 14 | Guest Checkout by Email | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 15 | Official MP SDK Component | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 16 | Fictitious Bank Transfer Display | ORIGINAL_REQUEST §R2 | ≥5 | ≥5 | ✓ | ✓ |
| 17 | Frontend Client & Error Handling | ORIGINAL_REQUEST §R2, §R3 | ≥5 | ≥5 | ✓ | ✓ |

---

## Test Architecture
- **Location**: `tests/e2e/`
- **Runner**: Node.js / Jest or TypeScript / Python test harness with zero runtime external dependencies or mock server fallback for opaque-box testing.
- **Pass/Fail Semantics**: Exit code 0 if all tests pass; non-zero if any test fails. Output includes structured report with pass/fail counts.
- **Directory Layout**:
  - `tests/e2e/tier1_feature_coverage/`
  - `tests/e2e/tier2_boundary_corner/`
  - `tests/e2e/tier3_cross_feature/`
  - `tests/e2e/tier4_real_world_scenarios/`
  - `tests/e2e/run_all_e2e_tests.js` (or `.py` / npm script)

---

## Real-World Application Scenarios (Tier 4)
| # | Scenario | Features Exercised | Complexity |
|---|----------|--------------------|------------|
| 1 | Guest buyer purchases 2 items via MP sandbox card, receives approval, order marked PAID, stock decremented, notification emitted | F1, F2, F6, F7, F9, F10, F11, F14, F15 | High |
| 2 | Guest buyer selects bank transfer, views fictitious CBU/CUIL/Titular, confirms transfer, order marked CONFIRMED, stock decremented | F1, F3, F6, F7, F9, F10, F11, F14, F16 | Medium |
| 3 | Checkout timer counts down in real time, reaches 10-minute expiry (00:00), automatically resets email & payment inputs, attempts to pay are rejected | F1, F12, F13, F14, F17 | High |
| 4 | Adversarial security probe: submission with raw card PAN/CVV in payload, checks that backend rejects or strips and never logs/exposes PAN | F2, F7 | High |
| 5 | Stock exhaustion during checkout: buyer attempts payment for out-of-stock item, post-payment catches stock shortage gracefully | F1, F2, F10, F17 | High |

---

## Coverage Thresholds
- **Tier 1 (Feature Coverage)**: ≥5 test cases per feature (17 × 5 = 85 tests).
- **Tier 2 (Boundary & Corner)**: ≥5 test cases per boundary/edge condition (≥85 tests).
- **Tier 3 (Cross-Feature Combinations)**: ≥17 tests covering pairwise interactions.
- **Tier 4 (Real-World Scenarios)**: ≥5 comprehensive application scenarios.
- **Total Minimum Target**: ~192 test cases.
- **Completion Signal**: Publishes `TEST_READY.md` at project root when all suites are runnable.
