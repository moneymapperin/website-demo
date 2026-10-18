import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

async function verifyHmacSha256(secret: string, rawBody: string, expectedHex: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const signatureBytes = await crypto.subtle.sign('HMAC', key, encoder.encode(rawBody));
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
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', { status: 405 });
  }

  try {
    const signature = req.headers.get('x-razorpay-signature');
    if (!signature) {
      return new Response(JSON.stringify({ error: 'Missing x-razorpay-signature header' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const webhookSecret = Deno.env.get('RAZORPAY_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('RAZORPAY_WEBHOOK_SECRET not configured');
      return new Response(JSON.stringify({ error: 'Webhook secret not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const rawBody = await req.text();
    const isValid = await verifyHmacSha256(webhookSecret, rawBody, signature);

    if (!isValid) {
      return new Response(JSON.stringify({ error: 'Invalid webhook signature' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload = JSON.parse(rawBody);
    const event = payload.event;

    // We process captured payment or paid order events
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity;
      const orderEntity = payload.payload?.order?.entity;

      const orderId = paymentEntity?.order_id || orderEntity?.id;
      const paymentId = paymentEntity?.id;

      if (!orderId) {
        return new Response(JSON.stringify({ status: 'ignored', reason: 'No order_id' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
      const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

      // Find ledger entry
      const { data: record, error: fetchError } = await supabaseAdmin
        .schema('bse_data')
        .from('subscription_payments')
        .select('*')
        .eq('razorpay_order_id', orderId)
        .maybeSingle();

      if (fetchError || !record) {
        console.warn(`Webhook: Order ${orderId} not found in subscription_payments`);
        return new Response(JSON.stringify({ status: 'ignored', reason: 'Order not found' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Idempotency: if already fulfilled, do nothing
      if (record.status === 'fulfilled') {
        return new Response(JSON.stringify({ status: 'already_fulfilled' }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Call stack_subscription RPC
      const { error: rpcError } = await supabaseAdmin.rpc('stack_subscription', {
        p_user_id: record.user_id,
        p_months_to_add: record.months,
      });

      if (rpcError) {
        console.error('Webhook: stack_subscription RPC failed:', rpcError);
        return new Response(JSON.stringify({ error: 'RPC failure' }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      // Mark fulfilled
      await supabaseAdmin
        .schema('bse_data')
        .from('subscription_payments')
        .update({
          razorpay_payment_id: paymentId || record.razorpay_payment_id,
          status: 'fulfilled',
          fulfilled_at: new Date().toISOString(),
        })
        .eq('id', record.id);

      return new Response(JSON.stringify({ status: 'fulfilled' }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ status: 'ignored', event }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('razorpay-webhook error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
