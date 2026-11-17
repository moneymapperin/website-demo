import { supabase } from '../lib/supabase';

interface DebugPaymentResult {
  transactions: any[] | null;
  subscription: Record<string, any> | null;
  verdict: string;
  errors: {
    auth?: { message?: string; code?: string };
    transactions?: { message?: string; code?: string };
    subscription?: { message?: string; code?: string };
  };
}

declare global {
  interface Window {
    __debugPayment?: () => Promise<DebugPaymentResult>;
  }
}

export function installDebugPayment(): void {
  window.__debugPayment = async (): Promise<DebugPaymentResult> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      const error = authError
        ? { message: authError.message, code: authError.code }
        : { message: 'No logged-in user', code: undefined };
      console.error('[Payment debug] Unable to identify the current user', error);
      console.table([]);
      console.table([]);
      const verdict = 'Unable to inspect payment state for the current user.';
      console.info(`[Payment debug] ${verdict}`);
      return {
        transactions: null,
        subscription: null,
        verdict,
        errors: { auth: error },
      };
    }

    const [transactionsResult, subscriptionResult] = await Promise.all([
      supabase
        .schema('payments')
        .from('transactions')
        .select(
          'id, gateway_transaction_id, status, amount_paid, plan_id, referral_code, created_at'
        )
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .schema('bse_data')
        .from('user_subscriptions')
        .select()
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    const transactions = transactionsResult.data;
    const subscription = subscriptionResult.data;
    const errors: DebugPaymentResult['errors'] = {};

    if (transactionsResult.error) {
      errors.transactions = {
        message: transactionsResult.error.message,
        code: transactionsResult.error.code,
      };
      console.error('[Payment debug] Transactions query failed', errors.transactions);
    }
    if (subscriptionResult.error) {
      errors.subscription = {
        message: subscriptionResult.error.message,
        code: subscriptionResult.error.code,
      };
      console.error('[Payment debug] Subscription query failed', errors.subscription);
    }

    console.table(transactions || []);
    console.table(subscription ? [subscription] : []);

    const latestStatus = String(transactions?.[0]?.status || '').toUpperCase();
    const periodEnd = subscription?.current_period_end
      ? new Date(subscription.current_period_end).getTime()
      : Number.NaN;
    const hasFuturePeriod = !Number.isNaN(periodEnd) && periodEnd > Date.now();
    let verdict: string;

    if (transactionsResult.error || subscriptionResult.error) {
      verdict = 'One or more queries failed; see the error message and code above (possibly a missing RLS policy).';
    } else if (latestStatus === 'PENDING') {
      verdict = 'Finalize never succeeded (payment not confirmed on server).';
    } else if (latestStatus === 'SUCCESS') {
      if (!subscription || !hasFuturePeriod) {
        verdict =
          'Transaction is SUCCESS but subscription was not stacked or is expired.';
      } else if (String(subscription.tier || '').toUpperCase() === 'PRO') {
        verdict =
          'Server shows PRO. Problem is in the website reading or caching the plan.';
      } else {
        verdict = 'Transaction is SUCCESS and subscription is active, but its tier is not PRO.';
      }
    } else {
      verdict = latestStatus
        ? `Latest transaction status is ${latestStatus}.`
        : 'No recent transaction was found.';
    }

    console.info(`[Payment debug] ${verdict}`);

    return {
      transactions,
      subscription,
      verdict,
      errors,
    };
  };
}
