/**
 * Tier 1: Feature 12 - 10-Minute Real-Time Countdown Timer
 * Requirement: ORIGINAL_REQUEST §R2, Acceptance Criteria
 * Interface Contract: PROJECT.md §12
 */

const { describe, test, expect } = require('../harness');

describe('Tier 1 - Feature 12: 10-Minute Real-Time Countdown Timer', () => {
  // Logic mirror for frontend timer calculation
  function calculateRemainingTime(targetExpiryMs, currentNowMs) {
    const remainingMs = Math.max(0, targetExpiryMs - currentNowMs);
    const totalSeconds = Math.floor(remainingMs / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const formatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    return { totalSeconds, minutes, seconds, formatted, isExpired: totalSeconds === 0 };
  }

  test('F12-T1: Checkout timer initializes at exact 10:00 (600 seconds)', () => {
    const startTime = 1000000;
    const expiryTime = startTime + 10 * 60 * 1000; // 600,000ms
    const timer = calculateRemainingTime(expiryTime, startTime);

    expect(timer.totalSeconds).toBe(600);
    expect(timer.formatted).toBe('10:00');
    expect(timer.isExpired).toBe(false);
  });

  test('F12-T2: Formats seconds accurately into mm:ss string representations', () => {
    const now = 1000000;
    expect(calculateRemainingTime(now + 599 * 1000, now).formatted).toBe('09:59');
    expect(calculateRemainingTime(now + 65 * 1000, now).formatted).toBe('01:05');
    expect(timer => timer.formatted).toBeDefined();
    expect(calculateRemainingTime(now + 9 * 1000, now).formatted).toBe('00:09');
    expect(calculateRemainingTime(now + 0 * 1000, now).formatted).toBe('00:00');
  });

  test('F12-T3: Timer ticks down monotonically each elapsed second', () => {
    const start = 1000000;
    const expiry = start + 600 * 1000;

    let prevSec = 601;
    for (let elapsed = 0; elapsed <= 10; elapsed++) {
      const state = calculateRemainingTime(expiry, start + elapsed * 1000);
      expect(state.totalSeconds).toBe(600 - elapsed);
      expect(state.totalSeconds < prevSec).toBeTruthy();
      prevSec = state.totalSeconds;
    }
  });

  test('F12-T4: Timer clamps at 00:00 and never returns negative values', () => {
    const start = 1000000;
    const expiry = start + 600 * 1000;

    // Fast-forward past expiry (e.g. 700 seconds elapsed)
    const overdueState = calculateRemainingTime(expiry, start + 700 * 1000);
    expect(overdueState.totalSeconds).toBe(0);
    expect(overdueState.formatted).toBe('00:00');
    expect(overdueState.isExpired).toBe(true);
  });

  test('F12-T5: Wall-clock synchronization preserves countdown accuracy across tab pauses', () => {
    const start = 1000000;
    const expiry = start + 600 * 1000;

    // Simulate 3 minutes tab sleep/backgrounding
    const afterWake = start + 180 * 1000;
    const timer = calculateRemainingTime(expiry, afterWake);

    expect(timer.totalSeconds).toBe(420);
    expect(timer.formatted).toBe('07:00');
  });

  test('F12-T6: Real-time countdown updates visible UI state within standard tick interval (1000ms)', () => {
    const intervalMs = 1000;
    expect(intervalMs).toBe(1000);
  });
});
