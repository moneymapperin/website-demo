import { supabase } from '../lib/supabase';
import { SubPlan } from '../pages/SubscriptionPage';

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

declare global {
  interface Window {
    Razorpay?: any;
  }
}

class PaymentService {
  private scriptLoadingPromise: Promise<boolean> | null = null;

  /**
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
