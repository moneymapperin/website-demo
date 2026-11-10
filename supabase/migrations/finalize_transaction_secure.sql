-- Migration: Secure finalize_transaction with Synchronous Gateway Verification
-- Replaces: public.finalize_transaction(p_order_id text) RETURNS boolean
-- Security: SECURITY DEFINER, search_path = '', schema-qualified calls
-- Extensions required: extensions.http (pgsql-http), extensions.pgcrypto

-- 1. Ensure required extensions exist in extensions schema
CREATE EXTENSION IF NOT EXISTS http WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- 2. Create the secure finalize_transaction function
CREATE OR REPLACE FUNCTION public.finalize_transaction(p_order_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_user uuid;
  v_tx record;
  v_gw record;
  v_user_email text;
  v_user_phone text;
  v_user_meta jsonb;
  v_amount_str text;
  v_confirmed boolean := false;
  v_http_resp extensions.http_response;
  v_resp_json jsonb;
  v_url text;
  v_hash text;
  v_cf_order_status text;
  v_cf_amount numeric;
  v_eb_status text;
  v_eb_amount numeric;
BEGIN
  -- 1. Authentication check
  v_user := auth.uid();
  IF v_user IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 2. Lock & fetch transaction joined to plan for caller
  SELECT
    t.id,
    t.user_id,
    t.plan_id,
    t.amount_paid,
    t.status,
    t.gateway_transaction_id,
    p.months_duration,
    p.title
  INTO v_tx
  FROM payments.transactions t
  JOIN payments.plans p ON p.id = t.plan_id
  WHERE t.gateway_transaction_id = p_order_id
    AND t.user_id = v_user
  FOR UPDATE OF t;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Transaction not found';
  END IF;

  -- 3. Idempotent check
  IF v_tx.status = 'SUCCESS' THEN
    -- Already finalized; return true without stacking again
    RETURN true;
  END IF;

  IF v_tx.status <> 'PENDING' THEN
    RAISE EXCEPTION 'Transaction not payable';
  END IF;

  -- 4. Gateway Verification Setup
  SELECT email, raw_user_meta_data
  INTO v_user_email, v_user_meta
  FROM auth.users
  WHERE id = v_user;

  v_user_email := COALESCE(NULLIF(pg_catalog.trim(v_user_email), ''), 'guest@moneymapper.in');
  v_user_phone := COALESCE(NULLIF(pg_catalog.trim(v_user_meta->>'mobile'), ''), '9999999999');
  v_amount_str := pg_catalog.to_char(v_tx.amount_paid, 'FM999999990.00');

  -- Set ~8s total timeout for outbound HTTP calls (pgsql-http extension)
  BEGIN
    PERFORM extensions.http_set_curlopt('CURLOPT_TIMEOUT', '8');
    PERFORM extensions.http_set_curlopt('CURLOPT_CONNECTTIMEOUT', '4');
  EXCEPTION WHEN OTHERS THEN
    -- If curlopt helper is unavailable in specific build, continue with statement timeout
    RAISE LOG 'http_set_curlopt notice: %', SQLERRM;
  END;

  -- Loop through active gateway configurations in priority order
  FOR v_gw IN
    SELECT provider, api_key, secret_salt, endpoint_url, is_default, priority_order
    FROM payments.gateway_config
    ORDER BY is_default DESC, priority_order ASC
  LOOP
    -- A. Cashfree Verification
    IF pg_catalog.upper(v_gw.provider) LIKE '%CASHFREE%' THEN
      BEGIN
        v_url := pg_catalog.rtrim(v_gw.endpoint_url, '/') || '/orders/' || p_order_id;

        v_http_resp := extensions.http((
          'GET',
          v_url,
          ARRAY[
            extensions.http_header('x-api-version', '2022-09-01'),
            extensions.http_header('x-client-id', v_gw.api_key),
            extensions.http_header('x-client-secret', v_gw.secret_salt),
            extensions.http_header('Accept', 'application/json')
          ],
          NULL,
          NULL
        )::extensions.http_request);

        IF v_http_resp.status = 200 AND v_http_resp.content IS NOT NULL THEN
          v_resp_json := v_http_resp.content::jsonb;
          v_cf_order_status := pg_catalog.upper(COALESCE(v_resp_json->>'order_status', ''));
          v_cf_amount := COALESCE((v_resp_json->>'order_amount')::numeric, 0);

          -- Cashfree confirms paid when order_status is 'PAID' and amount matches
          IF v_cf_order_status = 'PAID' AND pg_catalog.abs(v_cf_amount - v_tx.amount_paid) <= 0.01 THEN
            v_confirmed := true;
            EXIT; -- Verified!
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Cashfree verification call encountered error for order %: %', p_order_id, SQLERRM;
      END;

    -- B. Easebuzz (Federal Bank) Verification
    ELSIF pg_catalog.upper(v_gw.provider) LIKE '%FEDERAL_BANK%' THEN
      BEGIN
        -- Derive dashboard retrieval host from endpoint_url
        -- Test/Sandbox uses testdashboard.easebuzz.in, Production uses dashboard.easebuzz.in
        IF v_gw.endpoint_url ILIKE '%test%' THEN
          v_url := 'https://testdashboard.easebuzz.in/transaction/v1/retrieve';
        ELSE
          v_url := 'https://dashboard.easebuzz.in/transaction/v1/retrieve';
        END IF;

        -- Hash calculation: sha512(key|txnid|amount|email|phone|salt)
        v_hash := pg_catalog.encode(
          extensions.digest(
            v_gw.api_key || '|' || p_order_id || '|' || v_amount_str || '|' || v_user_email || '|' || v_user_phone || '|' || v_gw.secret_salt,
            'sha512'
          ),
          'hex'
        );

        v_http_resp := extensions.http((
          'POST',
          v_url,
          ARRAY[
            extensions.http_header('Content-Type', 'application/x-www-form-urlencoded'),
            extensions.http_header('Accept', 'application/json')
          ],
          'application/x-www-form-urlencoded',
          'key=' || v_gw.api_key ||
          '&txnid=' || p_order_id ||
          '&amount=' || v_amount_str ||
          '&email=' || v_user_email ||
          '&phone=' || v_user_phone ||
          '&hash=' || v_hash
        )::extensions.http_request);

        IF v_http_resp.status = 200 AND v_http_resp.content IS NOT NULL THEN
          v_resp_json := v_http_resp.content::jsonb;
          -- Easebuzz returns status 1 (or true) with transaction data under msg or data object
          IF (v_resp_json->>'status' = '1' OR v_resp_json->>'status' = 'true') THEN
            v_eb_status := pg_catalog.lower(COALESCE(v_resp_json->'msg'->>'status', v_resp_json->'data'->>'status', ''));
            v_eb_amount := COALESCE((COALESCE(v_resp_json->'msg'->>'amount', v_resp_json->'data'->>'amount'))::numeric, 0);

            IF v_eb_status = 'success' AND pg_catalog.abs(v_eb_amount - v_tx.amount_paid) <= 0.01 THEN
              v_confirmed := true;
              EXIT; -- Verified!
            END IF;
          END IF;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        RAISE LOG 'Easebuzz verification call encountered error for order %: %', p_order_id, SQLERRM;
      END;
    END IF;
  END LOOP;

  -- 5. If no gateway confirmed payment, raise PAYMENT_PENDING
  IF NOT v_confirmed THEN
    RAISE EXCEPTION 'PAYMENT_PENDING';
  END IF;

  -- 6. Confirmed: update transaction and stack subscription server-side
  UPDATE payments.transactions
  SET status = 'SUCCESS'
  WHERE id = v_tx.id
    AND status = 'PENDING';

  -- Call existing stack_subscription with server-verified plan months
  PERFORM public.stack_subscription(v_user, v_tx.months_duration);

  -- 7. Return true on success
  RETURN true;
END;
$$;

-- 8. Access control: revoke from public/anon, grant only to authenticated and service_role
REVOKE ALL ON FUNCTION public.finalize_transaction(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.finalize_transaction(text) TO authenticated, service_role;

