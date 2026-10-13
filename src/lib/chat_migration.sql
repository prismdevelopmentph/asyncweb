-- Chat Widget Migration (General & Support)
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.chat_messages (
    id BIGSERIAL PRIMARY KEY,
    channel TEXT NOT NULL CHECK (channel IN ('general', 'support')),
    ticket_id TEXT,                     -- NULL for general; sender discord_user_id for support
    sender_id TEXT NOT NULL,            -- Discord Snowflake ID
    sender_name TEXT NOT NULL,          -- Display Name / Username
    sender_avatar TEXT,                 -- Discord CDN avatar URL or null
    content TEXT NOT NULL,              -- Sanitized message text
    is_admin BOOLEAN DEFAULT FALSE,     -- True if sent by admin from /admin
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_general ON public.chat_messages (channel, created_at DESC) WHERE channel = 'general';
CREATE INDEX IF NOT EXISTS idx_chat_messages_support ON public.chat_messages (ticket_id, created_at ASC) WHERE channel = 'support';
CREATE INDEX IF NOT EXISTS idx_chat_messages_created ON public.chat_messages (created_at DESC);

-- Enable Row Level Security (read allowed for anon/authenticated, insert via service_role API or verified policy)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read chat_messages" ON public.chat_messages
    FOR SELECT USING (true);

CREATE POLICY "Allow insert chat_messages" ON public.chat_messages
    FOR INSERT WITH CHECK (true);

-- Enable Supabase Realtime replication on chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;
