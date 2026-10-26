-- ==============================================================================
-- ASYNC DEVELOPMENT - Recommended Supabase B-Tree Performance Indexes
-- Run this script in the Supabase SQL Editor to guarantee sub-millisecond
-- execution on uncapped /admin full-dataset queries and edge security checks.
-- ==============================================================================

-- 1. Support Chat & Tickets
CREATE INDEX IF NOT EXISTS idx_chat_messages_ticket_created
  ON chat_messages (ticket_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created
  ON chat_messages (channel, created_at DESC);

-- 2. Security Lockouts & Bans (Edge Middleware & Admin Roster)
CREATE INDEX IF NOT EXISTS idx_security_lockouts_ip
  ON security_lockouts (ip_address);

CREATE INDEX IF NOT EXISTS idx_security_lockouts_uid
  ON security_lockouts (discord_user_id);

CREATE INDEX IF NOT EXISTS idx_security_lockouts_created
  ON security_lockouts (created_at DESC);

-- 3. Generator Licenses
CREATE INDEX IF NOT EXISTS idx_licenses_redeemed_by
  ON licenses (redeemed_by);

CREATE INDEX IF NOT EXISTS idx_licenses_reseller_id
  ON licenses (reseller_id);

CREATE INDEX IF NOT EXISTS idx_licenses_key
  ON licenses (license_key);

CREATE INDEX IF NOT EXISTS idx_licenses_created_at
  ON licenses (created_at DESC);

-- 4. Store Orders & Ledger
CREATE INDEX IF NOT EXISTS idx_orders_created_at
  ON orders (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_status
  ON orders (status);

CREATE INDEX IF NOT EXISTS idx_orders_user_id
  ON orders (user_id);

CREATE INDEX IF NOT EXISTS idx_orders_email
  ON orders (email);

-- 5. Audit & Telemetry Logs
CREATE INDEX IF NOT EXISTS idx_claim_logs_claimed_at
  ON website_claim_logs (claimed_at DESC);

CREATE INDEX IF NOT EXISTS idx_download_logs_downloaded_at
  ON client_download_logs (downloaded_at DESC);
