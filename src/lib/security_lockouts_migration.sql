-- ==============================================================================
-- ASYNC SECURITY LOCKOUTS - UNIQUE INDEX & PERFORMANCE SCHEMA
-- ==============================================================================

-- 1. Ensure the security_lockouts table exists
CREATE TABLE IF NOT EXISTS public.security_lockouts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address TEXT NOT NULL,
    reason TEXT NOT NULL DEFAULT 'DevTools Inspection Detected',
    user_agent TEXT,
    url TEXT,
    discord_user_id TEXT,
    is_banned BOOLEAN NOT NULL DEFAULT true,
    notified_discord BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Add Unique Index on ip_address to enable atomic ON CONFLICT upsert
CREATE UNIQUE INDEX IF NOT EXISTS idx_security_lockouts_ip_unique 
ON public.security_lockouts (ip_address);

-- 3. Add Performance Indexes for middleware lookup and admin dashboard
CREATE INDEX IF NOT EXISTS idx_security_lockouts_discord_uid 
ON public.security_lockouts (discord_user_id) 
WHERE discord_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_security_lockouts_is_banned 
ON public.security_lockouts (is_banned);

CREATE INDEX IF NOT EXISTS idx_security_lockouts_created_at 
ON public.security_lockouts (created_at DESC);

