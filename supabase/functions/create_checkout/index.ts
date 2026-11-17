import { createClient } from 'npm:@supabase/supabase-js@2'
import { crypto } from "https://deno.land/std@0.168.0/crypto/mod.ts"

// ---------------------------------------------------------
// 1. Configuration & Setup
// ---------------------------------------------------------
let SUPABASE_URL = Deno.env.get("URL_SUPABASE");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SERVICE_ROLE_KEY_SUPABASE");
const SUPABASE_ANON_KEY = Deno.env.get("ANON_KEY_SUPABASE");

if (!SUPABASE_URL) throw new Error("URL_SUPABASE is required in secrets");
if (!SUPABASE_SERVICE_ROLE_KEY) throw new Error("SERVICE_ROLE_KEY_SUPABASE is required in secrets");
if (!SUPABASE_ANON_KEY) throw new Error("ANON_KEY_SUPABASE is required in secrets");

SUPABASE_URL = SUPABASE_URL.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  db: { schema: 'payments' }
});

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ---------------------------------------------------------
// 2. Gateway Implementations
// ---------------------------------------------------------

async function initiateFederalBank(gateway: any, orderId: string, amount: number, user: any, plan: any) {
  const finalAmountStr = amount.toFixed(2);
  const email = user.email || 'guest@moneymapper.in';
  const firstname = user.user_metadata?.fullName || 'User';
  const phone = user.user_metadata?.mobile || '9999999999';
  const productinfo = plan.title.substring(0, 45);

  // Easebuzz exact hash sequence: key|txnid|amount|productinfo|firstname|email|||||||||||salt
  const hashString = `${gateway.api_key}|${orderId}|${finalAmountStr}|${productinfo}|${firstname}|${email}|||||||||||${gateway.secret_salt}`;

  const hashBuffer = await crypto.subtle.digest("SHA-512", new TextEncoder().encode(hashString));
  const hashHex = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

  const formData = new URLSearchParams();
  formData.append('key', gateway.api_key);
  formData.append('txnid', orderId);
  formData.append('amount', finalAmountStr);
  formData.append('productinfo', productinfo);
  formData.append('firstname', firstname);
  formData.append('phone', phone);
  formData.append('email', email);
  formData.append('surl', 'https://moneymapper.in/payment/success');
  formData.append('furl', 'https://moneymapper.in/payment/failure');
  formData.append('hash', hashHex);

  // Normalize endpoint URL provided in DB (handle trailing slashes and missing paths)
  let baseUrl = gateway.endpoint_url || 'https://testpay.easebuzz.in';
  baseUrl = baseUrl.replace(/\/$/, '');
  const initUrl = baseUrl.endsWith('/payment/initiateLink') ? baseUrl : `${baseUrl}/payment/initiateLink`;

  const response = await fetch(initUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Accept': 'application/json' },
    body: formData.toString()
  });

  const data = await response.json();
  if (data.status === 1) {
    const payMode = initUrl.includes('testpay') ? 'test' : 'production';
    return {
      access_key: data.data,
      pay_mode: payMode,
      order_id: orderId,
      provider: 'FEDERAL_BANK'
    };
  } else {
    throw new Error(`Federal Bank Error: ${data.data || data.error_desc}`);
  }
}

async function initiateCashfree(gateway: any, orderId: string, amount: number, user: any, plan: any) {
  const finalAmountStr = amount.toFixed(2);
  const email = user.email || 'guest@moneymapper.in';
  const phone = user.user_metadata?.mobile || '9999999999';

  // Normalize endpoint URL provided in DB
  let baseUrl = gateway.endpoint_url || 'https://sandbox.cashfree.com/pg';
  baseUrl = baseUrl.replace(/\/$/, '');
  const initUrl = baseUrl.endsWith('/orders') ? baseUrl : `${baseUrl}/orders`;

  const payload = {
    order_id: orderId,
    order_amount: parseFloat(finalAmountStr),
    order_currency: "INR",
    customer_details: {
      customer_id: user.id.replace(/[^a-zA-Z0-9_]/g, '').substring(0, 50), // Cashfree id limits
      customer_email: email,
      customer_phone: phone
    },
    order_meta: {
      return_url: `https://moneymapper.in/payment/verify?order_id=${orderId}`
    }
  };

  const response = await fetch(initUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-version': '2022-09-01',
      'x-client-id': gateway.api_key,
      'x-client-secret': gateway.secret_salt
    },
    body: JSON.stringify(payload)
  });

  const data = await response.json();

  if (response.ok && data.payment_session_id) {
    const payMode = initUrl.includes('sandbox') ? 'TEST' : 'PROD';
    return {
      payment_session_id: data.payment_session_id,
      pay_mode: payMode,
      order_id: orderId,
      provider: 'CASHFREE'
    };
  } else {
    throw new Error(`Cashfree Error: ${data.message || JSON.stringify(data)}`);
  }
}

// ---------------------------------------------------------
// 3. Main Deno Edge Handler with Fallback Routing
// ---------------------------------------------------------
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { plan_code, referral_code } = await req.json()
    
    // 1. Auth Check
    const authHeader = req.headers.get('Authorization') || req.headers.get('authorization')
    if (!authHeader) return new Response(JSON.stringify({ error: 'Missing auth header' }), { status: 401, headers: corsHeaders })

    const supabaseUserClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { global: { headers: { Authorization: authHeader } } })
    const { data: { user }, error: userError } = await supabaseUserClient.auth.getUser()
    if (!user || userError) return new Response(JSON.stringify({ error: 'Unauthorized user session' }), { status: 401, headers: corsHeaders })

    // 2. Plan & Discount Logic
    const { data: plan, error: planError } = await supabaseAdmin.from('plans').select('*').eq('plan_code', plan_code).single()
    if (planError || !plan) return new Response(JSON.stringify({ error: 'Plan not found' }), { status: 404, headers: corsHeaders })

    let discount = 0;
    if (referral_code) {
      const { data: previousUses } = await supabaseAdmin.from('transactions').select('id').eq('user_id', user.id).not('referral_code', 'is', null).eq('status', 'SUCCESS')
      if (!previousUses || previousUses.length === 0) {
        const { data: ref } = await supabaseAdmin.from('referral_codes').select('*').eq('code', referral_code.toUpperCase()).eq('is_active', true).single()
        if (ref) discount = ref.discount_amount
      }
    }
    const finalAmount = plan.discounted_price - discount;

    // 3. Dynamic Gateway Routing based on Database Config
    const { data: gateways, error: gatewayError } = await supabaseAdmin
      .from('gateway_config')
      .select('*')
      .order('is_default', { ascending: false }) // True comes first
      .order('priority_order', { ascending: true }); // Lower number = higher priority

    if (gatewayError || !gateways || gateways.length === 0) {
        return new Response(JSON.stringify({ error: 'No payment gateways are currently configured in the database.' }), { status: 500, headers: corsHeaders })
    }

    // Generate Global Order ID (Must be < 40 chars for most gateways)
    const orderId = "MM" + Date.now().toString() + Math.floor(Math.random() * 1000).toString();

    let successfulResponse = null;
    let fallbackErrors = [];

    // Fallback Loop - Iterate through gateways in priority order
    for (const gateway of gateways) {
      try {
        const providerName = (gateway.provider || '').toUpperCase().trim();
        console.log(`Attempting checkout with provider: ${providerName}`);

        if (providerName.includes('FEDERAL_BANK')) {
            successfulResponse = await initiateFederalBank(gateway, orderId, finalAmount, user, plan);
        } else if (providerName.includes('CASHFREE')) {
            successfulResponse = await initiateCashfree(gateway, orderId, finalAmount, user, plan);
        } else {
            console.log(`Unsupported provider configuration skipped: ${providerName}`);
            continue; // Skip this and try the next gateway
        }

        // If we reach this line, the gateway succeeded!
        break;
      } catch (err: any) {
        console.error(`Provider ${gateway.provider} failed to initialize: ${err.message}`);
        fallbackErrors.push(`[${gateway.provider}]: ${err.message}`);
        // Loop continues to the next gateway automatically
      }
    }

    if (!successfulResponse) {
        // If the loop finished and ALL gateways threw exceptions
        return new Response(JSON.stringify({
            error: 'All payment gateways are currently unavailable.',
            details: fallbackErrors
        }), { status: 500, headers: corsHeaders });
    }

    // 4. Create Pending Transaction Record using the successful provider
    await supabaseAdmin.from('transactions').insert({
      user_id: user.id,
      plan_id: plan.id,
      referral_code: referral_code ? referral_code.toUpperCase() : null,
      amount_paid: finalAmount,
      gateway_transaction_id: orderId
      // You can add a `provider` column to your transactions table to track this:
      // provider: successfulResponse.provider
    }).select().single()

    return new Response(JSON.stringify(successfulResponse), { headers: { ...corsHeaders, "Content-Type": "application/json" } })

  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error?.message || String(error) }), { status: 500, headers: corsHeaders })
  }
})
