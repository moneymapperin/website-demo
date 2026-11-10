-- Read-Only Audit Query: Reconcile Successful Transactions against PRO Subscriptions
-- File: supabase/migrations/reconcile_success_transactions.sql
-- Purpose: Inspect all payments.transactions with status = 'SUCCESS' alongside
-- the user's current subscription record in bse_data.user_subscriptions.
-- Helps identify past purchases that were marked SUCCESS by the old finalize_transaction
-- but never had their PRO duration stacked in user_subscriptions.
--
-- THIS SCRIPT ONLY READS DATA. IT DOES NOT MODIFY ANY TABLES.

SELECT 
    t.id AS transaction_id,
    t.user_id,
    t.gateway_transaction_id AS order_id,
    t.amount_paid,
    t.status AS transaction_status,
    t.created_at AS transaction_created_at,
    p.plan_code,
    p.title AS plan_title,
    p.months_duration,
    s.tier AS user_subscription_tier,
    s.status AS user_subscription_status,
    s.current_period_end,
    s.updated_at AS subscription_updated_at,
    CASE 
        WHEN s.user_id IS NULL THEN 'NO_SUBSCRIPTION_ROW'
        WHEN s.current_period_end IS NULL OR s.current_period_end <= t.created_at THEN 'EXPIRED_OR_NOT_STACKED'
        ELSE 'ACTIVE_PRO'
    END AS fulfillment_audit_status
FROM payments.transactions t
JOIN payments.plans p ON p.id = t.plan_id
LEFT JOIN bse_data.user_subscriptions s ON s.user_id = t.user_id
WHERE t.status = 'SUCCESS'
ORDER BY t.created_at DESC;

