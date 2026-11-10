import { supabase } from '../lib/supabase';

export type CheckoutResponse =
  | { provider: 'FEDERAL_BANK'; access_key: string; pay_mode: 'test' | 'production'; order_id: string }
  | { provider: 'CASHFREE'; payment_session_id: string; pay_mode: 'TEST' | 'PROD'; order_id: string };

export class GatewaysUnavailableError extends Error {
  code = 'GATEWAYS_UNAVAILABLE';
  constructor(message = 'Payments are temporarily down for maintenance. Please try again later.') {
    super(message);
    this.name = 'GatewaysUnavailableError';
  }
}

/**
 * Creates a checkout session by calling the Supabase Edge Function `create_checkout`.
 *
 * @param planCode - The plan code string (e.g. 'PRO_YEARLY', 'PRO_HALF_YEARLY', 'PRO_QUARTERLY')
 * @param referralCode - Optional referral code to apply discounts
 * @returns Typed CheckoutResponse depending on active provider ('FEDERAL_BANK' or 'CASHFREE')
 */
export async function createCheckout(
  planCode: string,
  referralCode?: string
): Promise<CheckoutResponse> {
  const rawBaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
  const baseUrl = rawBaseUrl.replace(/\/+$/, '');
  const endpoint = `${baseUrl}/functions/v1/create_checkout`;

  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();

  if (sessionError || !session?.access_token) {
    throw new Error('User not logged in');
  }

  const token = session.access_token;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  };

  const body: Record<string, any> = {
    plan_code: planCode,
  };

  if (referralCode && typeof referralCode === 'string' && referralCode.trim() !== '') {
    body.referral_code = referralCode.trim();
  }

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (err: any) {
    throw new Error('Network error. Failed to initiate checkout.');
  }

  let responseData: any;
  try {
    responseData = await response.json();
  } catch (err) {
    throw new Error('Payment gateway response error. Please try again later.');
  }

  if (!response.ok) {
    const errorText = responseData?.error || responseData?.message || '';
    if (
      response.status === 500 &&
      errorText.includes('All payment gateways are currently unavailable')
    ) {
      throw new GatewaysUnavailableError(
        'Payments are temporarily down for maintenance. Please try again later.'
      );
    }
    throw new Error(errorText || `Checkout initiation failed with status ${response.status}`);
  }

  if (responseData?.provider === 'FEDERAL_BANK') {
    if (!responseData.access_key || !responseData.order_id) {
      throw new Error('Invalid Federal Bank checkout response from server');
    }
    return {
      provider: 'FEDERAL_BANK',
      access_key: responseData.access_key,
      pay_mode: responseData.pay_mode || 'test',
      order_id: responseData.order_id,
    };
  }

  if (responseData?.provider === 'CASHFREE') {
    if (!responseData.payment_session_id || !responseData.order_id) {
      throw new Error('Invalid Cashfree checkout response from server');
    }
    return {
      provider: 'CASHFREE',
      payment_session_id: responseData.payment_session_id,
      pay_mode: responseData.pay_mode || 'TEST',
      order_id: responseData.order_id,
    };
  }

  throw new Error(`Unsupported payment provider: ${responseData?.provider}`);
}

