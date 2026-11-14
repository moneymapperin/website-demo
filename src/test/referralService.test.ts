import { describe, it, expect, vi } from 'vitest';
import { validateReferralCode } from '../services/referralService';
import { calculateDiscountedPrice } from '../config/referralRules';

describe('calculateDiscountedPrice (price display helper)', () => {
  it('caps effective discount to plan price: min(discount_amount, plan price)', () => {
    // Exact match: 1497 discount on 1497 plan
    const res1 = calculateDiscountedPrice(1497, 1497);
    expect(res1.effectiveDiscount).toBe(1497);
    expect(res1.finalPrice).toBe(0);

    // Over-discount: 2000 discount on 1497 plan -> capped at 1497
    const res2 = calculateDiscountedPrice(1497, 2000);
    expect(res2.effectiveDiscount).toBe(1497);
    expect(res2.finalPrice).toBe(0);
  });

  it('calculates final price as max(0, plan price - discount), never negative', () => {
    const res = calculateDiscountedPrice(500, 1000);
    expect(res.finalPrice).toBe(0);
    expect(res.finalPrice).not.toBeLessThan(0);
  });

  it('returns normal price and 0 discount when discount is 0 or negative', () => {
    const res = calculateDiscountedPrice(3588, 0);
    expect(res.effectiveDiscount).toBe(0);
    expect(res.finalPrice).toBe(3588);
  });

  it('correctly calculates partial discount on higher tier plan', () => {
    const res = calculateDiscountedPrice(3588, 200);
    expect(res.effectiveDiscount).toBe(200);
    expect(res.finalPrice).toBe(3388);
  });
});

describe('validateReferralCode', () => {
  const createMockClient = (
    activeRow: any = { discount_amount: 1497, is_active: true },
    existingTx: any[] = []
  ) => ({
    schema: vi.fn().mockReturnValue({
      from: vi.fn((table: string) => {
        if (table === 'referral_codes') {
          return {
            select: vi.fn().mockReturnThis(),
            ilike: vi.fn().mockReturnThis(),
            maybeSingle: vi.fn().mockResolvedValue({
              data: activeRow,
              error: null,
            }),
          };
        }
        if (table === 'transactions') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            not: vi.fn().mockReturnThis(),
            limit: vi.fn().mockResolvedValue({
              data: existingTx,
              error: null,
            }),
          };
        }
        return {};
      }),
    }),
    auth: {
      getUser: vi.fn().mockResolvedValue({ data: { user: { id: 'user_123' } } }),
    },
  });

  it('returns false and empty message for empty or whitespace code', async () => {
    const mockClient = {};
    const res1 = await validateReferralCode('', mockClient);
    expect(res1.valid).toBe(false);
    expect(res1.discountAmount).toBe(0);
    expect(res1.message).toBe('');

    const res2 = await validateReferralCode('   ', mockClient);
    expect(res2.valid).toBe(false);
    expect(res2.discountAmount).toBe(0);
    expect(res2.message).toBe('');
  });

  it('active referral code works on Quarterly (PRO_QUARTERLY)', async () => {
    const mockClient = createMockClient({ discount_amount: 1497, is_active: true });
    const result = await validateReferralCode('FINFREE', mockClient, null, 'PRO_QUARTERLY', 1497);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.discountAmount).toBe(1497);
    expect(result.effectiveDiscount).toBe(1497);
    expect(result.message).toBe('Code Applied! ₹1497 off.');
  });

  it('active referral code works on Half-Yearly (PRO_HALF_YEARLY)', async () => {
    const mockClient = createMockClient({ discount_amount: 1497, is_active: true });
    const result = await validateReferralCode('FINFREE', mockClient, null, 'PRO_HALF_YEARLY', 2394);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.discountAmount).toBe(1497);
    expect(result.effectiveDiscount).toBe(1497);
    expect(result.message).toBe('Code Applied! ₹1497 off.');
  });

  it('active referral code works on Yearly (PRO_YEARLY)', async () => {
    const mockClient = createMockClient({ discount_amount: 1497, is_active: true });
    const result = await validateReferralCode('FINFREE', mockClient, null, 'PRO_YEARLY', 3588);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.discountAmount).toBe(1497);
    expect(result.effectiveDiscount).toBe(1497);
    expect(result.message).toBe('Code Applied! ₹1497 off.');
  });

  it('works with lowercase input (finfree -> valid on any plan)', async () => {
    const mockClient = createMockClient({ discount_amount: 1497, is_active: true });
    const result = await validateReferralCode('finfree', mockClient, null, 'PRO_YEARLY', 3588);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.discountAmount).toBe(1497);
    expect(result.message).toBe('Code Applied! ₹1497 off.');
  });

  it('caps effective discount to plan price when discount is larger than plan price', async () => {
    const mockClient = createMockClient({ discount_amount: 2000, is_active: true });
    const result = await validateReferralCode('BIGDISCOUNT', mockClient, null, 'PRO_QUARTERLY', 1497);
    expect(result.valid).toBe(true);
    expect(result.status).toBe('valid');
    expect(result.discountAmount).toBe(2000);
    expect(result.effectiveDiscount).toBe(1497);
    expect(result.message).toBe('Code Applied! ₹1497 off.');
  });

  it('returns invalid message if referral code does not exist in database', async () => {
    const mockClient = createMockClient(null);
    const result = await validateReferralCode('NONEXISTENT', mockClient);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('invalid');
    expect(result.discountAmount).toBe(0);
    expect(result.message).toBe('Invalid or expired referral code.');
  });

  it('returns invalid message if referral code is inactive', async () => {
    const mockClient = createMockClient({ discount_amount: 1497, is_active: false });
    const result = await validateReferralCode('FINFREE', mockClient);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('invalid');
    expect(result.discountAmount).toBe(0);
    expect(result.message).toBe('Invalid or expired referral code.');
  });

  it('returns previous claim message if user already used a referral code with SUCCESS transaction', async () => {
    const mockClient = createMockClient({ discount_amount: 1497, is_active: true }, [{ id: 'tx_prev_1' }]);
    const result = await validateReferralCode('FINFREE', mockClient, 'user_already_claimed', 'PRO_QUARTERLY');
    expect(result.valid).toBe(false);
    expect(result.status).toBe('already_used');
    expect(result.discountAmount).toBe(0);
    expect(result.message).toBe('You have already claimed a referral discount previously.');
  });

  it('handles exceptions gracefully with error validating code message', async () => {
    const mockClient = {
      schema: vi.fn().mockImplementation(() => {
        throw new Error('Database connection failed');
      }),
    };

    const result = await validateReferralCode('TESTCODE', mockClient);
    expect(result.valid).toBe(false);
    expect(result.status).toBe('invalid');
    expect(result.discountAmount).toBe(0);
    expect(result.message).toBe('Error validating code.');
  });
});
