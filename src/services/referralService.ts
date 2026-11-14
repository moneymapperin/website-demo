import { supabase } from '../lib/supabase';
import { calculateDiscountedPrice } from '../config/referralRules';

export type ReferralValidationStatus = 'valid' | 'invalid' | 'already_used';

export interface ReferralValidationResult {
  valid: boolean;
  status: ReferralValidationStatus;
  discountAmount: number;
  effectiveDiscount?: number;
  message: string;
}

export const REFERRAL_STORAGE_KEY = 'saved_referral_code';

/**
 * Validates a referral code against Supabase.
 *
 * Rules:
 * 1. Empty code resets discount and clears message.
 * 2. Code is checked in payments.referral_codes for is_active == true (case-insensitive via ilike).
 * 3. User is checked in payments.transactions for any prior SUCCESS transaction with a non-null referral_code.
 * 4. Any active referral code is valid on ALL subscription plans.
 * 5. Returns status ('valid' | 'invalid' | 'already_used'), discountAmount, effectiveDiscount, and user message.
 */
export async function validateReferralCode(
  code: string,
  client: any = supabase,
  userId?: string | null,
  _planCode?: string,
  planPrice?: number
): Promise<ReferralValidationResult> {
  const trimmedCode = (code || '').trim().toUpperCase();
  if (!trimmedCode) {
    return {
      valid: false,
      status: 'invalid',
      discountAmount: 0,
      message: '',
    };
  }

  try {
    // 1. Look up active referral code in payments.referral_codes
    const { data: refResponse, error: refError } = await client
      .schema('payments')
      .from('referral_codes')
      .select('discount_amount, is_active')
      .ilike('code', trimmedCode)
      .maybeSingle();

    if (refError || !refResponse || refResponse.is_active !== true) {
      return {
        valid: false,
        status: 'invalid',
        discountAmount: 0,
        message: 'Invalid or expired referral code.',
      };
    }

    // 2. Resolve user ID (if not provided, check current session)
    let currentUserId = userId;
    if (currentUserId === undefined && client.auth) {
      try {
        const { data: authData } = await client.auth.getUser();
        currentUserId = authData?.user?.id ?? null;
      } catch {
        currentUserId = null;
      }
    }

    // 3. Check if user has already used ANY referral code successfully
    if (currentUserId) {
      const { data: usageCheck, error: usageError } = await client
        .schema('payments')
        .from('transactions')
        .select('id')
        .eq('user_id', currentUserId)
        .not('referral_code', 'is', null)
        .eq('status', 'SUCCESS')
        .limit(1);

      if (!usageError && usageCheck && usageCheck.length > 0) {
        return {
          valid: false,
          status: 'already_used',
          discountAmount: 0,
          message: 'You have already claimed a referral discount previously.',
        };
      }
    }

    // 4. Valid on all plans
    const rawDiscount = Number(refResponse.discount_amount) || 0;
    const { effectiveDiscount } = planPrice !== undefined
      ? calculateDiscountedPrice(planPrice, rawDiscount)
      : { effectiveDiscount: rawDiscount };

    return {
      valid: true,
      status: 'valid',
      discountAmount: rawDiscount,
      effectiveDiscount,
      message: `Code Applied! ₹${effectiveDiscount.toFixed(0)} off.`,
    };
  } catch (err) {
    console.debug('[ReferralService] Validation failed: error during validation', err);
    return {
      valid: false,
      status: 'invalid',
      discountAmount: 0,
      message: 'Error validating code.',
    };
  }
}
