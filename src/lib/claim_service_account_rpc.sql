-- ============================================================================
-- Atomic Account Claim RPC - Fix Function Overload Conflict
-- Run this in Supabase SQL Editor
-- ============================================================================

-- 1. Drop both overloaded signatures so only one canonical function exists
DROP FUNCTION IF EXISTS public.claim_service_account(character varying, character varying);
DROP FUNCTION IF EXISTS public.claim_service_account(text, text);

-- 2. Create the unified canonical function using TEXT parameters
CREATE OR REPLACE FUNCTION public.claim_service_account(
    p_user_id TEXT,
    p_service_name TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_service_id UUID;
    v_service_name VARCHAR;
    v_table_name TEXT;
    v_account_id UUID;
    v_account_data JSONB;
    v_account_raw TEXT;
    v_now TIMESTAMPTZ := NOW();
    v_today DATE := CURRENT_DATE;
    v_lic RECORD;
    v_covers BOOLEAN;
    v_used_count INT;
    v_limit INT;
    v_candidate_license_id UUID := NULL;
    v_candidate_maxed_out BOOLEAN := FALSE;
    v_candidate_max_limit INT := 0;
BEGIN
    SELECT id, name INTO v_service_id, v_service_name
    FROM public.services
    WHERE LOWER(name) = LOWER(TRIM(p_service_name))
    LIMIT 1;

    IF v_service_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'status', 404, 'error', 'Service "' || p_service_name || '" not found.');
    END IF;

    v_table_name := 'accounts_' || regexp_replace(lower(trim(v_service_name)), '[^a-z0-9]+', '_', 'g');
    v_table_name := regexp_replace(v_table_name, '^_+|_+$', '', 'g');

    -- Search active licenses (isolated dedicated first, then shared)
    FOR v_lic IN
        SELECT l.id, l.daily_limit, COALESCE(l.quota_mode, 'shared') AS quota_mode, l.package_id
        FROM public.licenses l
        WHERE l.redeemed_by = p_user_id
          AND l.is_active = TRUE
          AND (l.expires_at IS NULL OR l.expires_at > v_now)
        ORDER BY 
            CASE WHEN COALESCE(l.quota_mode, 'shared') = 'isolated' THEN 0 ELSE 1 END,
            l.created_at ASC
    LOOP
        v_covers := FALSE;

        IF v_lic.package_id IS NOT NULL THEN
            IF EXISTS (SELECT 1 FROM public.package_services ps WHERE ps.package_id = v_lic.package_id AND ps.service_id = v_service_id) THEN
                v_covers := TRUE;
            END IF;
        ELSIF EXISTS (SELECT 1 FROM public.license_services ls WHERE ls.license_id = v_lic.id AND ls.service_id = v_service_id) THEN
            v_covers := TRUE;
        ELSIF NOT EXISTS (SELECT 1 FROM public.license_services ls WHERE ls.license_id = v_lic.id) THEN
            v_covers := TRUE;
        END IF;

        IF v_covers THEN
            SELECT COALESCE(SUM(used_count), 0) INTO v_used_count
            FROM public.license_daily_usages
            WHERE license_id = v_lic.id AND usage_date = v_today;

            v_limit := COALESCE(v_lic.daily_limit, 15);

            IF v_used_count < v_limit THEN
                v_candidate_license_id := v_lic.id;
                EXIT;
            ELSE
                v_candidate_maxed_out := TRUE;
                v_candidate_max_limit := v_limit;
            END IF;
        END IF;
    END LOOP;

    IF v_candidate_license_id IS NULL THEN
        IF v_candidate_maxed_out THEN
            RETURN jsonb_build_object(
                'success', false,
                'status', 429,
                'error', 'Daily limit of ' || v_candidate_max_limit || ' for ' || v_service_name || ' reached. Resets at midnight.'
            );
        ELSE
            RETURN jsonb_build_object(
                'success', false,
                'status', 403,
                'error', 'You do not have an active license covering ' || v_service_name || '.'
            );
        END IF;
    END IF;

    -- Atomic account pull with SKIP LOCKED
    BEGIN
        EXECUTE format('
            SELECT id, data, COALESCE(raw_line, data->>''raw'', data->>''data'', data::text)
            FROM public.%I
            WHERE is_used = FALSE
            ORDER BY id ASC
            LIMIT 1
            FOR UPDATE SKIP LOCKED
        ', v_table_name)
        INTO v_account_id, v_account_data, v_account_raw;
    EXCEPTION WHEN OTHERS THEN
        RETURN jsonb_build_object('success', false, 'status', 404, 'error', v_service_name || ' stock table not accessible.');
    END;

    IF v_account_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'status', 404, 'error', v_service_name || ' is currently out of stock.');
    END IF;

    -- Update account status
    EXECUTE format('UPDATE public.%I SET is_used = TRUE, claimed_by = %L, claimed_at = %L WHERE id = %L',
        v_table_name, p_user_id, v_now, v_account_id);

    -- Increment usage in license_daily_usages
    INSERT INTO public.license_daily_usages (license_id, discord_id, service_name, usage_date, used_count, updated_at)
    VALUES (v_candidate_license_id, p_user_id, v_service_name, v_today, 1, v_now)
    ON CONFLICT (license_id, service_name, usage_date)
    DO UPDATE SET used_count = license_daily_usages.used_count + 1, updated_at = EXCLUDED.updated_at;

    -- Update legacy user_limits
    UPDATE public.user_limits
    SET count = count + 1, updated_at = v_now
    WHERE discord_user_id = p_user_id AND license_id = v_candidate_license_id::text;

    -- If no user_limits row exists for this new license, initialize it so counts never freeze
    IF NOT FOUND THEN
        BEGIN
            INSERT INTO public.user_limits (discord_user_id, license_id, count, updated_at)
            VALUES (p_user_id, v_candidate_license_id::text, 1, v_now);
        EXCEPTION WHEN OTHERS THEN
            UPDATE public.user_limits
            SET count = count + 1, updated_at = v_now
            WHERE discord_user_id = p_user_id AND license_id = v_candidate_license_id::text;
        END;
    END IF;

    -- Audit log
    BEGIN
        INSERT INTO public.website_claim_logs (service_name, account_id, raw_data, discord_user_id, claimed_at, notified_discord, source)
        VALUES (v_service_name, v_account_id::text, COALESCE(v_account_raw, 'Credentials claimed'), p_user_id, v_now, FALSE, 'Web Generator');
    EXCEPTION WHEN OTHERS THEN NULL; END;

    RETURN jsonb_build_object('success', true, 'service', v_service_name, 'accountData', COALESCE(v_account_raw, v_account_data::text));
END;
$$;
