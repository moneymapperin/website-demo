declare global {
  interface Window {
    EasebuzzCheckout?: any;
    Cashfree?: (config: { mode: 'sandbox' | 'production' }) => {
      checkout: (options: {
        paymentSessionId: string;
        redirectTarget?: string;
        returnUrl?: string;
      }) => Promise<{
        error?: { message?: string; code?: string };
        redirect?: boolean;
        paymentDetails?: any;
      }>;
    };
  }
}

export const EASEBUZZ_SCRIPT_URL =
  'https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/easebuzz-checkout.js';
export const CASHFREE_SCRIPT_URL = 'https://sdk.cashfree.com/js/v3/cashfree.js';

let easebuzzLoadingPromise: Promise<boolean> | null = null;
let cashfreeLoadingPromise: Promise<boolean> | null = null;

/**
 * Dynamically loads the Easebuzz Web Checkout script once.
 * Source: Official Easebuzz Web Integration docs (EaseCheckout iFrame / AWS S3 static hosting)
 * URL: https://ebz-static.s3.ap-south-1.amazonaws.com/easecheckout/easebuzz-checkout.js
 */
export function loadEasebuzzScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.EasebuzzCheckout) return Promise.resolve(true);

  if (easebuzzLoadingPromise) {
    return easebuzzLoadingPromise;
  }

  easebuzzLoadingPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(
      `script[src="${EASEBUZZ_SCRIPT_URL}"]`
    );
    if (existingScript) {
      if (window.EasebuzzCheckout) {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = EASEBUZZ_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Easebuzz Checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return easebuzzLoadingPromise;
}

/**
 * Dynamically loads the Cashfree v3 Web Checkout script once.
 * Source: Official Cashfree Web Integration docs (https://sdk.cashfree.com/js/v3/cashfree.js)
 */
export function loadCashfreeScript(): Promise<boolean> {
  if (typeof window === 'undefined') return Promise.resolve(false);
  if (window.Cashfree) return Promise.resolve(true);

  if (cashfreeLoadingPromise) {
    return cashfreeLoadingPromise;
  }

  cashfreeLoadingPromise = new Promise<boolean>((resolve) => {
    const existingScript = document.querySelector(
      `script[src="${CASHFREE_SCRIPT_URL}"]`
    );
    if (existingScript) {
      if (window.Cashfree) {
        resolve(true);
        return;
      }
      existingScript.addEventListener('load', () => resolve(true));
      existingScript.addEventListener('error', () => resolve(false));
      return;
    }

    const script = document.createElement('script');
    script.src = CASHFREE_SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Cashfree Checkout script');
      resolve(false);
    };
    document.body.appendChild(script);
  });

  return cashfreeLoadingPromise;
}

/**
 * Test helper to reset internal loading promises across test cases.
 */
export function resetGatewayLoadersForTesting(): void {
  easebuzzLoadingPromise = null;
  cashfreeLoadingPromise = null;
}

