-- =============================================================================
-- Burilar - Supabase PostgreSQL Schema
-- Run this in Supabase Dashboard → SQL Editor before deploying
-- =============================================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    plan TEXT NOT NULL DEFAULT 'free',
    auth_provider TEXT DEFAULT 'email',
    avatar TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Chats
CREATE TABLE IF NOT EXISTS chats (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]',
    pinned BOOLEAN NOT NULL DEFAULT FALSE,
    is_tracking BOOLEAN NOT NULL DEFAULT FALSE,
    tracking_active BOOLEAN NOT NULL DEFAULT FALSE,
    update_count INTEGER NOT NULL DEFAULT 0,
    tracking_frequency TEXT,
    notification_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    notification_granularity TEXT NOT NULL DEFAULT 'update',
    thumbnail TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tracking Plans
CREATE TABLE IF NOT EXISTS tracking_plans (
    id TEXT PRIMARY KEY,
    user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    topic TEXT NOT NULL,
    objective TEXT NOT NULL,
    frequency_hours INTEGER NOT NULL DEFAULT 24,
    keywords JSONB NOT NULL DEFAULT '[]',
    last_search_result JSONB,
    last_search_time TIMESTAMPTZ,
    next_search_time TIMESTAMPTZ,
    active BOOLEAN NOT NULL DEFAULT FALSE,
    updates JSONB NOT NULL DEFAULT '[]',
    status TEXT NOT NULL DEFAULT 'pending',
    original_query TEXT NOT NULL DEFAULT '',
    clarification_info JSONB,
    suggested_prompt TEXT NOT NULL DEFAULT '',
    image_url TEXT NOT NULL DEFAULT '',
    strategy JSONB NOT NULL DEFAULT '{}',
    consecutive_not_useful INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    plan_id TEXT REFERENCES tracking_plans(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'info',
    link TEXT,
    read BOOLEAN NOT NULL DEFAULT FALSE,
    feedback TEXT,
    details JSONB,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Settings (one row per user, or one global row)
CREATE TABLE IF NOT EXISTS notification_settings (
    id TEXT PRIMARY KEY DEFAULT 'global',
    email_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    push_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    in_app_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    quiet_hours_start TEXT,
    quiet_hours_end TEXT,
    digest_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    digest_frequency TEXT NOT NULL DEFAULT 'daily',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert default notification settings row
INSERT INTO notification_settings (id) VALUES ('global')
ON CONFLICT (id) DO NOTHING;

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_updated_at ON chats(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_tracking_plans_user_id ON tracking_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_tracking_plans_active ON tracking_plans(active);
CREATE INDEX IF NOT EXISTS idx_tracking_plans_next_search ON tracking_plans(next_search_time);
CREATE INDEX IF NOT EXISTS idx_notifications_plan_id ON notifications(plan_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_timestamp ON notifications(timestamp DESC);
