import { describe, it, expect } from 'vitest';
import { DartRandom, getAnnualInflationRate } from '../utils/dartRandom';

describe('DartRandom and getAnnualInflationRate', () => {
  it('computes exact Dart VM PRNG rate for 2026', () => {
    expect(getAnnualInflationRate(2026)).toBe(7.73);
  });

  it('generates consistent numbers across calls for the same year', () => {
    const rate1 = getAnnualInflationRate(2026);
    const rate2 = getAnnualInflationRate(2026);
    expect(rate1).toBe(rate2);
  });

  it('generates numbers within the [6.70, 8.20] range for other years', () => {
    for (let yr = 2020; yr <= 2035; yr++) {
      const rate = getAnnualInflationRate(yr);
      expect(rate).toBeGreaterThanOrEqual(6.70);
      expect(rate).toBeLessThanOrEqual(8.20);
    }
  });

  it('DartRandom produces expected sequence with seed', () => {
    const rng = new DartRandom(12345);
    const val1 = rng.nextDouble();
    const val2 = rng.nextDouble();
    expect(val1).toBeGreaterThanOrEqual(0);
    expect(val1).toBeLessThan(1);
    expect(val2).toBeGreaterThanOrEqual(0);
    expect(val2).toBeLessThan(1);
    expect(val1).not.toBe(val2);
  });
});
