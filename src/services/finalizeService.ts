import { supabase } from '../lib/supabase';

export interface FinalizeResult {
  ok: boolean;
  data?: any;
  error?: string;
}

const FALLBACK_ERROR =
  'Payment received but sync delayed. Please contact support if PRO is not active.';

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Calls the finalize_transaction Supabase RPC to mark the transaction as SUCCESS
 * and stack/apply the PRO subscription.
 *
 * Success is ONLY when error is null AND data === true (a false result must not count as success).
 * If the error message contains 'PAYMENT_PENDING', retries the same RPC up to 4 times,
 * 2 seconds apart, then fails.
 * Any other error returns: "Payment received but sync delayed. Please contact support if PRO is not active."
 *
 * @param orderId - The Order ID returned by the payment gateway
 * @param retryDelayMs - Milliseconds between retries on PAYMENT_PENDING (default: 2000)
 * @param maxRetries - Maximum retry attempts on PAYMENT_PENDING (default: 4)
 */
export async function finalizeTransaction(
  orderId: string,
  retryDelayMs: number = 2000,
  maxRetries: number = 4
): Promise<FinalizeResult> {
  let attempts = 0;

  while (attempts <= maxRetries) {
    try {
      const { data, error } = await supabase.rpc('finalize_transaction', {
        p_order_id: orderId,
      });

      if (!error && data === true) {
        return { ok: true, data };
      }

      const errorMessage = error?.message || (data === false ? 'Finalization returned false' : '');

      if (errorMessage.includes('PAYMENT_PENDING') && attempts < maxRetries) {
        attempts++;
        await delay(retryDelayMs);
        continue;
      }

      console.error('Failed to finalize transaction', error || data);
      return {
        ok: false,
        error: FALLBACK_ERROR,
      };
    } catch (err: any) {
      const errMsg = err?.message || '';
      if (errMsg.includes('PAYMENT_PENDING') && attempts < maxRetries) {
        attempts++;
        await delay(retryDelayMs);
        continue;
      }

      console.error('Exception finalizing transaction', err);
      return {
        ok: false,
        error: FALLBACK_ERROR,
      };
    }
  }

  return {
    ok: false,
    error: FALLBACK_ERROR,
  };
}
