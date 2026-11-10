-- Drop the function if it exists to allow replacement
DROP FUNCTION IF EXISTS public.finalize_transaction(TEXT);

-- Create a secure RPC function to update transaction status
CREATE OR REPLACE FUNCTION public.finalize_transaction(p_order_id TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges to bypass RLS for this specific operation
AS $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 1. Ensure the user calling the function is authenticated
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 2. Update the transaction ONLY if it belongs to the caller and is currently pending
    UPDATE payments.transactions
    SET
        status = 'SUCCESS',
        updated_at = NOW()
    WHERE
        gateway_transaction_id = p_order_id
        AND user_id = v_user_id
        AND status != 'SUCCESS';

    -- 3. Return true if a row was updated
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;
