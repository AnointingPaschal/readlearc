-- Run this in Supabase SQL Editor → New Query → Run
-- Adds: profiles, platform_settings, activity, drafts tables

-- Profiles (username + social info)
CREATE TABLE IF NOT EXISTS profiles (
  wallet_address  VARCHAR(50)  PRIMARY KEY,
  username        VARCHAR(30)  UNIQUE,
  display_name    VARCHAR(100),
  bio             TEXT,
  avatar_color    VARCHAR(20)  DEFAULT '#6d28d9',
  website         VARCHAR(200),
  twitter         VARCHAR(50),
  created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- Platform settings (admin-configurable)
CREATE TABLE IF NOT EXISTS platform_settings (
  key        VARCHAR(50) PRIMARY KEY,
  value      TEXT        NOT NULL,
  label      VARCHAR(100),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE platform_settings DISABLE ROW LEVEL SECURITY;

-- Default settings
INSERT INTO platform_settings (key, value, label) VALUES
  ('article_default_price',  '0.020', 'Default Article Price (USDC)'),
  ('research_default_price', '0.050', 'Default Research Price (USDC)'),
  ('min_price',              '0.001', 'Minimum Price (USDC)'),
  ('max_price',              '10.00', 'Maximum Price (USDC)'),
  ('writer_pct',             '85',    'Writer Payout %'),
  ('platform_pct',           '10',    'Platform Fee %'),
  ('referrer_pct',           '5',     'Referrer Fee %')
ON CONFLICT (key) DO NOTHING;

-- Activity feed
CREATE TABLE IF NOT EXISTS activity (
  id             SERIAL      PRIMARY KEY,
  actor_address  VARCHAR(50) NOT NULL,
  action_type    VARCHAR(30) NOT NULL,
  target_address VARCHAR(50),
  article_id     INTEGER     REFERENCES articles(id) ON DELETE CASCADE,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_activity_actor  ON activity(actor_address);
CREATE INDEX IF NOT EXISTS idx_activity_target ON activity(target_address);
CREATE INDEX IF NOT EXISTS idx_activity_type   ON activity(action_type);
ALTER TABLE activity DISABLE ROW LEVEL SECURITY;

-- Drafts (research work in progress)
CREATE TABLE IF NOT EXISTS drafts (
  id             SERIAL      PRIMARY KEY,
  author_address VARCHAR(50) NOT NULL,
  title          TEXT        DEFAULT '',
  sections       JSONB       DEFAULT '[]',
  references     JSONB       DEFAULT '[]',
  keywords       TEXT[]      DEFAULT '{}',
  status         VARCHAR(20) DEFAULT 'draft',
  last_saved     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE drafts DISABLE ROW LEVEL SECURITY;

-- Trigger for profiles updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();
