-- ============================================================================
-- Production Generation Performance & Dynamic Stock Table Indexes
-- Eliminates Generation Latency & Accelerates Account Claim Execution
-- Execute this entire script in your Supabase SQL Editor
-- ============================================================================

-- 1. Accelerate Service Name Lookups in Claim RPC
CREATE INDEX IF NOT EXISTS idx_services_lower_name 
    ON public.services (LOWER(TRIM(name)));

-- 2. Generator Multi-License Evaluation & Expiration Check
CREATE INDEX IF NOT EXISTS idx_licenses_claim_eval 
    ON public.licenses (redeemed_by, is_active, expires_at) 
    WHERE redeemed_by IS NOT NULL;

-- 3. Daily Usages Conflict & Upsert Acceleration
-- Required by claim_service_account RPC: ON CONFLICT (license_id, service_name, usage_date)
CREATE UNIQUE INDEX IF NOT EXISTS idx_license_daily_usages_conflict
    ON public.license_daily_usages (license_id, service_name, usage_date);

CREATE INDEX IF NOT EXISTS idx_license_daily_usages_lookup
    ON public.license_daily_usages (license_id, usage_date);

-- 4. User Limits & Discord Guild Lock Indexes
CREATE INDEX IF NOT EXISTS idx_user_limits_user_license 
    ON public.user_limits (discord_user_id, license_id);

CREATE INDEX IF NOT EXISTS idx_user_guild_locks_user 
    ON public.user_guild_locks (discord_user_id);

-- 5. Package and Service Mapping Traversal
CREATE INDEX IF NOT EXISTS idx_package_services_composite 
    ON public.package_services (package_id, service_id);

CREATE INDEX IF NOT EXISTS idx_license_services_composite 
    ON public.license_services (license_id, service_id);

-- 6. Claim Logs Fast Auditing
CREATE INDEX IF NOT EXISTS idx_website_claim_logs_user_recent 
    ON public.website_claim_logs (discord_user_id, claimed_at DESC);

CREATE INDEX IF NOT EXISTS idx_website_claim_logs_service_recent 
    ON public.website_claim_logs (service_name, claimed_at DESC);

-- ============================================================================
-- 7. DYNAMIC STOCK TABLES AUTOMATED INDEXING (CRITICAL FOR GENERATION SPEED)
-- Automatically scans and applies partial indexes to all accounts_* tables.
-- Makes "SELECT ... WHERE is_used = FALSE ORDER BY id ASC FOR UPDATE SKIP LOCKED"
-- execute in sub-millisecond time regardless of how many thousands of rows exist.
-- ============================================================================

DO $$
DECLARE
    r RECORD;
    v_tbl TEXT;
    v_idx_unused TEXT;
    v_idx_claimed TEXT;
BEGIN
    FOR r IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_name LIKE 'accounts_%'
    LOOP
        v_tbl := quote_ident(r.table_name);
        v_idx_unused := quote_ident('idx_' || r.table_name || '_unused');
        v_idx_claimed := quote_ident('idx_' || r.table_name || '_claimed_by');

        -- Partial index for instantaneous stock availability pulling
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS %s 
            ON public.%s (id ASC) 
            WHERE is_used = FALSE;
        ', v_idx_unused, v_tbl);

        -- Index for fast user claim history queries
        EXECUTE format('
            CREATE INDEX IF NOT EXISTS %s 
            ON public.%s (claimed_by, claimed_at DESC) 
            WHERE claimed_by IS NOT NULL;
        ', v_idx_claimed, v_tbl);

        RAISE NOTICE 'Indexed stock table: %', r.table_name;
    END LOOP;
END $$;

-- 8. Refresh Query Planner Statistics across all affected tables
ANALYZE public.services;
ANALYZE public.licenses;
ANALYZE public.license_daily_usages;
ANALYZE public.user_limits;
ANALYZE public.package_services;
ANALYZE public.license_services;
ANALYZE public.website_claim_logs;

