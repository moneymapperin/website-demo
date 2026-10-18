import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifyHmacSha256(secret: string, message: string, expectedHex: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(message));
  const computedHex = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');

  const cleanExpected = expectedHex.toLowerCase().trim();
  if (computedHex.length !== cleanExpected.length) {
    return false;
  }

  let result = 0;
  for (let i = 0; i < computedHex.length; i++) {
    result |= computedHex.charCodeAt(i) ^ cleanExpected.charCodeAt(i);
  }
  return result === 0;
}

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
    const razorpayKeySecret = Deno.env.get('RAZORPAY_KEY_SECRET') ?? '';

    if (!razorpayKeySecret) {
      return new Response(JSON.stringify({ error: 'Server misconfigured: missing secret' }), {
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

    // 2. Parse body
    const body = await req.json().catch(() => ({}));
    const { orderId, paymentId, signature } = body;

    if (!orderId || !paymentId || !signature) {
      return new Response(JSON.stringify({ error: 'Missing orderId, paymentId, or signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 3. Verify Razorpay signature: HMAC_SHA256(order_id + "|" + payment_id, secret)
    const signPayload = `${orderId}|${paymentId}`;
    const isValidSignature = await verifyHmacSha256(razorpayKeySecret, signPayload, signature);

    if (!isValidSignature) {
      return new Response(JSON.stringify({ error: 'Invalid payment signature' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 4. Confirm the order belongs to this user and is recorded
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
    const { data: record, error: fetchError } = await supabaseAdmin
      .schema('bse_data')
      .from('subscription_payments')
      .select('*')
      .eq('razorpay_order_id', orderId)
      .maybeSingle();

    if (fetchError || !record) {
      return new Response(JSON.stringify({ error: 'Order not found in payments ledger' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (record.user_id !== user.id) {
      return new Response(JSON.stringify({ error: 'Order does not belong to authenticated user' }), {
        status: 403,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 5. Idempotent fulfillment: if already fulfilled, return updated state without re-stacking
    if (record.status === 'fulfilled') {
      const { data: currentSub } = await supabaseAdmin
        .schema('bse_data')
        .from('user_subscriptions')
        .select('current_period_end')
        .eq('user_id', user.id)
        .maybeSingle();

      return new Response(
        JSON.stringify({ ok: true, current_period_end: currentSub?.current_period_end }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 6. Call stack_subscription RPC with service role
    const { error: rpcError } = await supabaseAdmin.rpc('stack_subscription', {
      p_user_id: user.id,
      p_months_to_add: record.months,
    });

    if (rpcError) {
      console.error('stack_subscription RPC failed:', rpcError);
      return new Response(JSON.stringify({ error: 'Failed to update subscription duration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // 7. Mark row fulfilled in payments ledger
    const { error: updateError } = await supabaseAdmin
      .schema('bse_data')
      .from('subscription_payments')
      .update({
        razorpay_payment_id: paymentId,
        status: 'fulfilled',
        fulfilled_at: new Date().toISOString(),
      })
      .eq('id', record.id);

    if (updateError) {
      console.error('Failed to update ledger to fulfilled:', updateError);
    }

    // 8. Fetch updated period end
    const { data: updatedSub } = await supabaseAdmin
      .schema('bse_data')
      .from('user_subscriptions')
      .select('current_period_end')
      .eq('user_id', user.id)
      .maybeSingle();

    return new Response(
      JSON.stringify({ ok: true, current_period_end: updatedSub?.current_period_end }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (err: any) {
    console.error('verify-subscription-payment unexpected error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
