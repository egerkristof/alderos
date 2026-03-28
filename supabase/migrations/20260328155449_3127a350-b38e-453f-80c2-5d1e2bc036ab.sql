CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_session_id ON usage_events (session_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_mode ON usage_events (mode);