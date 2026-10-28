-- ============================================================================
-- ASYNC DEVELOPMENT - Visitor IP & Device Logger
-- Run this in your Supabase SQL Editor
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.visitor_logs (
    id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address    TEXT NOT NULL,
    device_id     TEXT,
    discord_id    TEXT,
    path          TEXT DEFAULT '/',
    user_agent    TEXT,
    visited_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes for sub-millisecond querying
CREATE INDEX IF NOT EXISTS idx_visitor_logs_ip ON public.visitor_logs (ip_address);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_device ON public.visitor_logs (device_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_discord ON public.visitor_logs (discord_id);
CREATE INDEX IF NOT EXISTS idx_visitor_logs_time ON public.visitor_logs (visited_at DESC);
