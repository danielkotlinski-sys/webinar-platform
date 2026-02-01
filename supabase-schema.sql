-- Webinar Platform Database Schema
-- Run this in your Supabase SQL editor to set up the database

-- Registered participants (populated from CSV upload)
CREATE TABLE IF NOT EXISTS registered_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Active sessions (for live viewer count)
CREATE TABLE IF NOT EXISTS active_sessions (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  last_ping TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Settings (for admin configuration like slow mode)
CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_registered_users_email ON registered_users(email);
CREATE INDEX IF NOT EXISTS idx_active_sessions_last_ping ON active_sessions(last_ping);
CREATE INDEX IF NOT EXISTS idx_active_sessions_email ON active_sessions(email);
CREATE INDEX IF NOT EXISTS idx_chat_messages_created_at ON chat_messages(created_at);
CREATE INDEX IF NOT EXISTS idx_chat_messages_is_pinned ON chat_messages(is_pinned);

-- Enable Row Level Security (RLS)
ALTER TABLE registered_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE active_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies for registered_users (read-only for anon, full access for service role)
CREATE POLICY "Allow anonymous read for registered_users" ON registered_users
  FOR SELECT USING (true);

-- Policies for active_sessions
CREATE POLICY "Allow insert for active_sessions" ON active_sessions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update own session" ON active_sessions
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete for active_sessions" ON active_sessions
  FOR DELETE USING (true);

CREATE POLICY "Allow select for active_sessions" ON active_sessions
  FOR SELECT USING (true);

-- Policies for chat_messages
CREATE POLICY "Allow insert for chat_messages" ON chat_messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow select non-deleted chat_messages" ON chat_messages
  FOR SELECT USING (is_deleted = false);

CREATE POLICY "Allow update for chat_messages" ON chat_messages
  FOR UPDATE USING (true);

-- Policies for settings
CREATE POLICY "Allow select for settings" ON settings
  FOR SELECT USING (true);

CREATE POLICY "Allow insert for settings" ON settings
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update for settings" ON settings
  FOR UPDATE USING (true);

-- Enable Realtime for chat_messages table
ALTER PUBLICATION supabase_realtime ADD TABLE chat_messages;
