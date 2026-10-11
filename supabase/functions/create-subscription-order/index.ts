import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PLAN_MAP: Record<string, { months: number; amountInPaise: number; title: string }> = {
  'moneymapper_quarterly_sub': { months: 3, amountInPaise: 149700, title: 'Quarterly Plan' },
  'moneymapper_halfyearly_sub': { months: 6, amountInPaise: 239400, title: 'Half-Yearly Plan' },
  'moneymapper_yearly_sub': { months: 12, amountInPaise: 358800, title: 'Yearly Plan' },
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing Authorization header' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? '';
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const razorpayKeyId = Deno.env.get('RAZORPAY_KEY_ID') ?? '';
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    if (!razorpayKeyId || !razorpayKeySecret) {
      return new Response(JSON.stringify({ error: 'Razorpay credentials not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 1. Verify user JWT
    const supabaseUserClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await supabaseUserClient.auth.getUser();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 2. Parse request body and look up server-side plan
    const body = await req.json().catch(() => ({}));
    const { planId } = body;
    const planInfo = PLAN_MAP[planId];

    if (!planInfo) {
      return new Response(JSON.stringify({ error: `Invalid planId: ${planId}` }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Create order with Razorpay Orders API
    const authString = btoa(`${razorpayKeyId}:${razorpayKeySecret}`);
    const rzpResponse = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify({
        amount: planInfo.amountInPaise,
        currency: 'INR',
        receipt: `sub_${user.id.slice(0, 8)}_${Date.now()}`,
        notes: {
          user_id: user.id,
          plan_id: planId,
          months: String(planInfo.months),
        },
      }),
    });

    if (!rzpResponse.ok) {
      const errText = await rzpResponse.text();
      return new Response(JSON.stringify({ error: `Failed to create Razorpay order: ${errText}` }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const rzpOrder = await rzpResponse.json();

    // 4. Insert pending record into bse_data.subscription_payments using service role
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { error: insertError } = await supabaseAdmin
      .schema('bse_data')
      .from('subscription_payments')
      .insert({
        user_id: user.id,
        razorpay_order_id: rzpOrder.id,
        plan_id: planId,
        months: planInfo.months,
        amount_paise: planInfo.amountInPaise,
        status: 'pending',
      });

    if (insertError) {
      console.error('Error inserting pending subscription payment:', insertError);
    }

    return new Response(
      JSON.stringify({
        orderId: rzpOrder.id,
        amount: planInfo.amountInPaise,
        currency: 'INR',
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('create-subscription-order unexpected error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
