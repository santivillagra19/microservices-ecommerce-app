/**
 * Tier 2: Boundary & Corner Cases - Feature 12: Timer Boundaries
 * Methodology: Boundary Value Analysis & Edge Precision
 */

const { describe, test, expect } = require('../harness');

describe('Tier 2 - Boundary: Timer Boundaries', () => {
  function formatSeconds(totalSeconds) {
    const clamped = Math.max(0, totalSeconds);
    const m = Math.floor(clamped / 60);
    const s = clamped % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }

  test('B12-T1: Displays exact 10:00 at t=600 seconds', () => {
    expect(formatSeconds(600)).toBe('10:00');
  });

  test('B12-T2: Displays exact 00:01 at t=1 second', () => {
    expect(formatSeconds(1)).toBe('00:01');
  });

  test('B12-T3: Displays exact 00:00 at t=0 seconds', () => {
    expect(formatSeconds(0)).toBe('00:00');
  });

  test('B12-T4: Protects against negative input values by clamping to 00:00', () => {
    expect(formatSeconds(-1)).toBe('00:00');
    expect(formatSeconds(-500)).toBe('00:00');
  });

  test('B12-T5: Formats single digit minutes and seconds with leading zeroes (e.g. 05:07, not 5:7)', () => {
    expect(formatSeconds(5 * 60 + 7)).toBe('05:07');
    expect(formatSeconds(1 * 60 + 9)).toBe('01:09');
    expect(formatSeconds(9)).toBe('00:09');
  });
});
