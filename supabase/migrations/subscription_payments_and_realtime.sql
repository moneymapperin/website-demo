-- Migration: Subscription Payments Ledger & Realtime Publication
-- Table: bse_data.subscription_payments
-- Purpose: Service-role only payments ledger tracking Razorpay orders, payments and fulfillment
-- Realtime: Adds bse_data.user_subscriptions to supabase_realtime publication idempotently

CREATE SCHEMA IF NOT EXISTS bse_data;

CREATE TABLE IF NOT EXISTS bse_data.subscription_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    razorpay_order_id TEXT NOT NULL UNIQUE,
    razorpay_payment_id TEXT UNIQUE,
    plan_id TEXT NOT NULL,
    months INTEGER NOT NULL,
    amount_paise INTEGER NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'fulfilled', 'failed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fulfilled_at TIMESTAMPTZ
);

-- Fast lookup indexes
CREATE INDEX IF NOT EXISTS idx_subscription_payments_user_id ON bse_data.subscription_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_subscription_payments_order_id ON bse_data.subscription_payments(razorpay_order_id);

-- Enable RLS with NO client policies (accessible by service role only)
ALTER TABLE bse_data.subscription_payments ENABLE ROW LEVEL SECURITY;

-- Realtime Publication for bse_data.user_subscriptions
-- Guarded and idempotent check against pg_publication_tables
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
      AND schemaname = 'bse_data' 
      AND tablename = 'user_subscriptions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE bse_data.user_subscriptions;
  END IF;
END $$;
