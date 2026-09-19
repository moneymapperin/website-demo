import { describe, it, expect } from 'vitest';
import {
  getTrialStartMs,
  isFeatureAccessible,
  getTrialDaysRemaining,
  isProPlan,
} from '../services/premiumService';

describe('Task 7: Premium & Trial Management Service (premiumService.ts)', () => {
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const ONE_HOUR_MS = 60 * 60 * 1000;

  describe('getTrialStartMs', () => {
    it('anchors trial start to user.created_at timestamp when present', () => {
      const createdAt = '2026-09-10T10:00:00.000Z';
      const expectedMs = new Date(createdAt).getTime();
      const user = { id: 'u1', created_at: createdAt };

      expect(getTrialStartMs(user)).toBe(expectedMs);
    });

    it('falls back to current time when user or created_at is null/invalid', () => {
      const before = Date.now();
      const startMs = getTrialStartMs(null);
      const after = Date.now();

      expect(startMs).toBeGreaterThanOrEqual(before);
      expect(startMs).toBeLessThanOrEqual(after);
    });
  });

  describe('isFeatureAccessible boundaries (6d23h vs 7d0h)', () => {
    const trialStartMs = 1700000000000;

    it('boundary at 6d 23h: accessible (daysPassed = 6 < 7)', () => {
      const nowMs = trialStartMs + (6 * ONE_DAY_MS) + (23 * ONE_HOUR_MS);
      expect(isFeatureAccessible(false, trialStartMs, nowMs)).toBe(true);
    });

    it('boundary at 7d 0h: locked (daysPassed = 7)', () => {
      const nowMs = trialStartMs + (7 * ONE_DAY_MS);
      expect(isFeatureAccessible(false, trialStartMs, nowMs)).toBe(false);
    });

    it('boundary at 7d 1s: locked', () => {
      const nowMs = trialStartMs + (7 * ONE_DAY_MS) + 1000;
      expect(isFeatureAccessible(false, trialStartMs, nowMs)).toBe(false);
    });

    it('PRO users are always accessible regardless of elapsed time', () => {
      const nowMs = trialStartMs + (100 * ONE_DAY_MS);
      expect(isFeatureAccessible(true, trialStartMs, nowMs)).toBe(true);
    });
  });

  describe('getTrialDaysRemaining sequence (7..0)', () => {
    const trialStartMs = 1700000000000;

    it('returns remaining days 7 down to 0 as whole days pass', () => {
      // Day 0: 0 days passed -> 7 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 1000)).toBe(7);

      // Day 1: 1 day passed -> 6 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + ONE_DAY_MS)).toBe(6);

      // Day 2: 2 days passed -> 5 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 2 * ONE_DAY_MS)).toBe(5);

      // Day 3: 3 days passed -> 4 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 3 * ONE_DAY_MS)).toBe(4);

      // Day 4: 4 days passed -> 3 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 4 * ONE_DAY_MS)).toBe(3);

      // Day 5: 5 days passed -> 2 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 5 * ONE_DAY_MS)).toBe(2);

      // Day 6 (6d 23h): 6 days passed -> 1 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 6 * ONE_DAY_MS + 23 * ONE_HOUR_MS)).toBe(1);

      // Day 7 (7d 0h): 7 days passed -> 0 remaining
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 7 * ONE_DAY_MS)).toBe(0);

      // Day 8+: 0 remaining (never negative)
      expect(getTrialDaysRemaining(false, trialStartMs, trialStartMs + 14 * ONE_DAY_MS)).toBe(0);
    });

    it('returns 365 for PRO users', () => {
      expect(getTrialDaysRemaining(true, trialStartMs, trialStartMs)).toBe(365);
      expect(getTrialDaysRemaining(true, trialStartMs, trialStartMs + 30 * ONE_DAY_MS)).toBe(365);
    });
  });

  describe('isProPlan normalization', () => {
    it('identifies valid pro/paid/wealth select strings', () => {
      expect(isProPlan('pro')).toBe(true);
      expect(isProPlan('MoneyMapper Pro Membership')).toBe(true);
      expect(isProPlan('wealth select pro')).toBe(true);
      expect(isProPlan('enterprise gold')).toBe(true);
      expect(isProPlan('paid')).toBe(true);
    });

    it('returns false for b2c or free or null plans', () => {
      expect(isProPlan('b2c')).toBe(false);
      expect(isProPlan('moneymapper free membership')).toBe(false);
      expect(isProPlan(null)).toBe(false);
      expect(isProPlan(undefined)).toBe(false);
    });
  });
});
