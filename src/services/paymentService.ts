import { supabase } from '../lib/supabase';
import { SubPlan } from '../pages/SubscriptionPage';
import { createCheckout } from './checkoutService';
import { loadEasebuzzScript, loadCashfreeScript } from './gatewayLoader';
import { finalizeTransaction } from './finalizeService';
import { apiService } from './apiService';

export interface PurchaseResult {
  ok: boolean;
  current_period_end?: string;
  orderId?: string;
  paymentId?: string;
}

export interface PurchaseError {
  isCancelled?: boolean;
  message: string;
}

export interface StartCheckoutOptions {
  referralCode?: string;
  navigate?: (to: string, options?: any) => void;
  showToast?: (opts: any) => void;
  refreshPlan?: (force?: boolean) => Promise<any>;
  onFinalizingChange?: (isFinalizing: boolean) => void;
}

export interface CheckoutResult {
  ok: boolean;
  orderId?: string;
}

declare global {
  interface Window {
    Razorpay?: any;
  }
}

class PaymentService {
  private scriptLoadingPromise: Promise<boolean> | null = null;

  /**
   * Retrieves the backend plan_code from the SubPlan.
   * Throws an error if planCode is missing before initiating checkout.
   */
  public getPlanCode(plan: SubPlan): string {
    if (plan?.planCode && typeof plan.planCode === 'string' && plan.planCode.trim() !== '') {
      return plan.planCode.trim();
    }
    throw new Error('Plan is not available for purchase right now.');
  }

  /**
   * Starts checkout flow using Supabase Edge Function `create_checkout`,
   * dynamically routing to Federal Bank (Easebuzz) or Cashfree,
   * followed by finalize_transaction RPC confirmation.
   */
  public async startCheckout(
    plan: SubPlan,
    options?: StartCheckoutOptions
  ): Promise<CheckoutResult> {
    const planCode = this.getPlanCode(plan);

    if (import.meta.env.DEV) {
      console.debug('[Checkout] Sending plan_code:', planCode);
    }

    // Step 1: Create checkout session via create_checkout Edge Function
    const checkoutData = await createCheckout(planCode, options?.referralCode);

    return new Promise<CheckoutResult>(async (resolve, reject) => {
      let overlayEl: HTMLElement | null = null;

      const showOverlay = () => {
        options?.onFinalizingChange?.(true);
        if (typeof document !== 'undefined') {
          overlayEl = document.getElementById('finalize-blocking-overlay');
          if (!overlayEl) {
            overlayEl = document.createElement('div');
            overlayEl.id = 'finalize-blocking-overlay';
            overlayEl.setAttribute('data-testid', 'finalize-blocking-overlay');
            overlayEl.className =
              'fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm';
            overlayEl.innerHTML = `
              <div class="flex flex-col items-center gap-3 p-6 rounded-3xl bg-[#0E0B1F] border border-indigo-500/30 shadow-2xl text-center max-w-sm mx-4">
                <div class="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                <p class="text-xs font-bold text-white">Confirming your payment, please do not close or refresh this page.</p>
              </div>
            `;
            document.body.appendChild(overlayEl);
          }
        }
      };

      const hideOverlay = () => {
        options?.onFinalizingChange?.(false);
        if (overlayEl && overlayEl.parentNode) {
          overlayEl.parentNode.removeChild(overlayEl);
          overlayEl = null;
        }
      };

      const beforeUnloadHandler = (event: BeforeUnloadEvent) => {
        event.preventDefault();
        event.returnValue = '';
        return '';
      };

      // Step 3: Finalize transaction and apply PRO subscription
      const finalize = async (orderId: string): Promise<void> => {
        showOverlay();
        if (typeof window !== 'undefined') {
          window.addEventListener('beforeunload', beforeUnloadHandler);
        }

        try {
          const result = await finalizeTransaction(orderId);
          if (result.ok) {
            if (options?.refreshPlan) {
              try {
                await options.refreshPlan(true);
              } catch {
                // Ignore refresh error
              }
            }

            // Confirm via apiService.getSubscriptionDetails() that current_period_end is in the future
            const details = await apiService.getSubscriptionDetails().catch(() => null);
            const periodEnd = details?.current_period_end;
            const isFuture =
              periodEnd &&
              !isNaN(new Date(periodEnd).getTime()) &&
              new Date(periodEnd).getTime() > Date.now();

            if (!isFuture) {
              hideOverlay();
              if (typeof window !== 'undefined') {
                window.removeEventListener('beforeunload', beforeUnloadHandler);
              }
              const errorMsg =
                'Payment received but sync delayed. Please contact support if PRO is not active.';
              options?.showToast?.(errorMsg);
              reject(new Error(errorMsg));
              return;
            }

            hideOverlay();
            if (typeof window !== 'undefined') {
              window.removeEventListener('beforeunload', beforeUnloadHandler);
            }

            if (options?.navigate) {
              options.navigate('/dashboard');
            } else if (typeof window !== 'undefined') {
              window.location.href = '/dashboard';
            }

            resolve({ ok: true, orderId });
          } else {
            hideOverlay();
            if (typeof window !== 'undefined') {
              window.removeEventListener('beforeunload', beforeUnloadHandler);
            }
            const errorMsg =
              result.error ||
              'Payment received but sync delayed. Please contact support if PRO is not active.';
            options?.showToast?.(errorMsg);
            reject(new Error(errorMsg));
          }
        } catch (err: any) {
          hideOverlay();
          if (typeof window !== 'undefined') {
            window.removeEventListener('beforeunload', beforeUnloadHandler);
          }
          const errorMsg =
            'Payment received but sync delayed. Please contact support if PRO is not active.';
          options?.showToast?.(errorMsg);
          reject(new Error(errorMsg));
        }
      };

      try {
        // Step 2: Branch on active provider
        if (checkoutData.provider === 'FEDERAL_BANK') {
          const loaded = await loadEasebuzzScript();
          if (!loaded || typeof (window as any).EasebuzzCheckout !== 'function') {
            throw new Error('Easebuzz checkout script failed to load. Please try again.');
          }

        const EasebuzzClass = (window as any).EasebuzzCheckout;
        let easebuzzCheckout: any;
        try {
          easebuzzCheckout = new EasebuzzClass(
            checkoutData.access_key,
            checkoutData.pay_mode
          );
        } catch {
          easebuzzCheckout = EasebuzzClass(
            checkoutData.access_key,
            checkoutData.pay_mode
          );
        }

          const ebOptions = {
            access_key: checkoutData.access_key,
            onResponse: async (response: any) => {
              if (response?.status === 'success') {
                await finalize(checkoutData.order_id);
              } else {
                console.error('Payment failed', response?.status || response);
                const isCancelled =
                  response?.status === 'user_cancelled' ||
                  response?.status === 'cancelled' ||
                  response?.status === 'dropped';
                const msg = isCancelled
                  ? 'Payment cancelled.'
                  : response?.error_Message || response?.error || 'Payment failed';
                options?.showToast?.(msg);
                reject({ isCancelled, message: msg });
              }
            },
            theme: '#4F46E5',
          };

          easebuzzCheckout.initiatePayment(ebOptions);
        } else if (checkoutData.provider === 'CASHFREE') {
          const loaded = await loadCashfreeScript();
          if (!loaded || typeof (window as any).Cashfree !== 'function') {
            throw new Error('Cashfree checkout script failed to load. Please try again.');
          }

          const cashfree = (window as any).Cashfree({
            mode: checkoutData.pay_mode === 'PROD' ? 'production' : 'sandbox',
          });

          const checkoutOptions = {
            paymentSessionId: checkoutData.payment_session_id,
            redirectTarget: '_modal',
          };

          cashfree.checkout(checkoutOptions).then(async (result: any) => {
            if (result?.error) {
              console.error('Payment failed', result.error);
              const isCancelled =
                result.error.message?.toLowerCase().includes('cancel') ||
                result.error.code === 'USER_DROPPED';
              const msg = isCancelled
                ? 'Payment cancelled.'
                : result.error.message || 'Payment failed';
              options?.showToast?.(msg);
              reject({ isCancelled, message: msg });
              return;
            }

            if (result?.redirect) {
              // Redirection flow - handled by browser
              return;
            }

            if (result?.paymentDetails) {
              await finalize(checkoutData.order_id);
            } else {
              options?.showToast?.('Payment cancelled.');
              reject({ isCancelled: true, message: 'Payment cancelled.' });
            }
          });
        }
      } catch (err: any) {
        reject(err);
      }
    });
  }

  // =========================================================================
  // LEGACY: Razorpay, replaced by create_checkout flow.
  // =========================================================================

  /**
   * // LEGACY: Razorpay, replaced by create_checkout flow.
   * Dynamically loads Razorpay checkout SDK once.
   */
  public loadRazorpayScript(): Promise<boolean> {
    if (typeof window === 'undefined') return Promise.resolve(false);
    if (window.Razorpay) return Promise.resolve(true);

    if (this.scriptLoadingPromise) {
      return this.scriptLoadingPromise;
    }

    this.scriptLoadingPromise = new Promise<boolean>((resolve) => {
      // Check if script tag already exists
      const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
      if (existingScript) {
        if (window.Razorpay) {
          resolve(true);
          return;
        }
        existingScript.addEventListener('load', () => resolve(true));
        existingScript.addEventListener('error', () => resolve(false));
        return;
      }

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => {
        console.error('Failed to load Razorpay Checkout script');
        resolve(false);
      };
      document.body.appendChild(script);
    });

    return this.scriptLoadingPromise;
  }

  /**
   * // LEGACY: Razorpay, replaced by create_checkout flow.
   * Starts purchase flow for the selected plan using Razorpay Standard Checkout
   * backed by Supabase Edge Functions.
   */
  public async startPurchase(plan: SubPlan): Promise<PurchaseResult> {
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID;
    if (!keyId || typeof keyId !== 'string' || keyId.trim() === '') {
      throw new Error('VITE_RAZORPAY_KEY_ID_MISSING');
    }

    // 1. Require logged-in session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      throw new Error('User not logged in');
    }

    // 2. Load SDK
    const loaded = await this.loadRazorpayScript();
    if (!loaded || !window.Razorpay) {
      throw new Error('UNAVAILABLE');
    }

    // 3. Create server-side order
    const { data: orderData, error: orderError } = await supabase.functions.invoke(
      'create-subscription-order',
      {
        body: { planId: plan.id },
      }
    );

    if (orderError || !orderData?.orderId) {
      const msg = orderError?.message || orderData?.error || 'Failed to create subscription order';
      throw new Error(msg);
    }

    const { orderId, amount, currency } = orderData;
    const userName =
      session.user.user_metadata?.fullName ||
      session.user.user_metadata?.name ||
      '';
    const userEmail = session.user.email || '';

    // 4. Open Razorpay Checkout modal
    return new Promise<PurchaseResult>((resolve, reject) => {
      let isSettled = false;

      const options = {
        key: keyId,
        amount,
        currency: currency || 'INR',
        name: 'MoneyMapper',
        description: plan.title,
        order_id: orderId,
        prefill: {
          name: userName,
          email: userEmail,
        },
        theme: {
          color: '#4F46E5',
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          if (isSettled) return;
          isSettled = true;

          try {
            // 5. Verify payment through backend edge function
            const { data: verifyData, error: verifyError } =
              await supabase.functions.invoke('verify-subscription-payment', {
                body: {
                  orderId: response.razorpay_order_id,
                  paymentId: response.razorpay_payment_id,
                  signature: response.razorpay_signature,
                },
              });

            if (verifyError || !verifyData?.ok) {
              const errMsg = verifyError?.message || verifyData?.error || 'Payment verification failed';
              reject(new Error(errMsg));
              return;
            }

            resolve({
              ok: true,
              current_period_end: verifyData.current_period_end,
              orderId: response.razorpay_order_id,
              paymentId: response.razorpay_payment_id,
            });
          } catch (err: any) {
            reject(new Error(err?.message || 'Payment verification failed'));
          }
        },
        modal: {
          ondismiss: () => {
            if (!isSettled) {
              isSettled = true;
              reject({ isCancelled: true, message: 'Payment cancelled.' });
            }
          },
        },
      };

      try {
        const rzp = new window.Razorpay(options);
        if (typeof rzp.on === 'function') {
          rzp.on('payment.failed', (resp: any) => {
            if (!isSettled) {
              isSettled = true;
              const reason = resp?.error?.description || resp?.error?.reason || 'Payment failed';
              reject(new Error(reason));
            }
          });
        }
        rzp.open();
      } catch (err: any) {
        if (!isSettled) {
          isSettled = true;
          reject(new Error(err?.message || 'Could not open payment window'));
        }
      }
    });
  }
}

export const paymentService = new PaymentService();
