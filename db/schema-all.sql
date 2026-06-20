-- ══════════════════════════════════════════════════════════════════
-- Readlearc — Complete Database Schema
-- Run this ONCE in Supabase SQL Editor (Dashboard → SQL Editor → New Query)
-- ══════════════════════════════════════════════════════════════════

-- ── Core: articles ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS articles (
  id             SERIAL       PRIMARY KEY,
  title          TEXT         NOT NULL,
  blurb          TEXT         DEFAULT '',
  content        TEXT         NOT NULL,
  price          NUMERIC(18,6) DEFAULT 0.02,
  category       VARCHAR(50)  DEFAULT 'General',
  read_time      INTEGER      DEFAULT 5,
  is_research    BOOLEAN      DEFAULT false,
  author_address VARCHAR(50)  NOT NULL,
  status         VARCHAR(20)  DEFAULT 'pending',
  featured       BOOLEAN      DEFAULT false,
  reads          INTEGER      DEFAULT 0,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE articles DISABLE ROW LEVEL SECURITY;

-- ── Read receipts (who paid for what) ─────────────────────────────
CREATE TABLE IF NOT EXISTS read_receipts (
  id             SERIAL       PRIMARY KEY,
  article_id     INTEGER      REFERENCES articles(id) ON DELETE CASCADE,
  reader_address VARCHAR(50)  NOT NULL,
  tx_hash        VARCHAR(100),
  amount_paid    NUMERIC(18,6),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, reader_address)
);
ALTER TABLE read_receipts DISABLE ROW LEVEL SECURITY;

-- ── Comments ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
  id             SERIAL       PRIMARY KEY,
  article_id     INTEGER      REFERENCES articles(id) ON DELETE CASCADE,
  author_address VARCHAR(50)  NOT NULL,
  author_name    VARCHAR(100),
  content        TEXT         NOT NULL,
  parent_id      INTEGER      REFERENCES comments(id) ON DELETE CASCADE,
  edited         BOOLEAN      DEFAULT false,
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
ALTER TABLE comments DISABLE ROW LEVEL SECURITY;

-- ── Reactions ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reactions (
  id            SERIAL       PRIMARY KEY,
  article_id    INTEGER      REFERENCES articles(id) ON DELETE CASCADE,
  address       VARCHAR(50)  NOT NULL,
  reaction_key  VARCHAR(20)  NOT NULL,
  created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, address)
);
ALTER TABLE reactions DISABLE ROW LEVEL SECURITY;

-- ── Follows ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS follows (
  id                SERIAL       PRIMARY KEY,
  follower_address  VARCHAR(50)  NOT NULL,
  following_address VARCHAR(50)  NOT NULL,
  created_at        TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);
ALTER TABLE follows DISABLE ROW LEVEL SECURITY;

-- ── User profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  wallet_address VARCHAR(50)   PRIMARY KEY,
  username       VARCHAR(30)   UNIQUE,
  display_name   VARCHAR(100),
  bio            TEXT,
  avatar_color   VARCHAR(20)   DEFAULT '#6d28d9',
  website        VARCHAR(200),
  twitter        VARCHAR(50),
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- ── Platform settings (admin) ─────────────────────────────────────
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
  ('referrer_pct',           '5',     'Referrer Fee %'),
  ('brand_color',            '#6d28d9','Brand Color'),
  ('bg_color',               '#f9f8f7','Background Color'),
  ('text_color',             '#18181b','Text Color'),
  ('accent_color',           '#059669','Accent Color'),
  ('card_color',             '#ffffff','Card Color'),
  ('border_color',           '#e5e3e1','Border Color'),
  ('brand_name',             'Readlearc','Brand Name'),
  ('brand_tagline',          'Pay per word. Own every read.','Tagline')
ON CONFLICT (key) DO NOTHING;

-- ── Activity feed ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity (
  id             SERIAL      PRIMARY KEY,
  actor_address  VARCHAR(50) NOT NULL,
  action_type    VARCHAR(30) NOT NULL,
  target_address VARCHAR(50),
  article_id     INTEGER     REFERENCES articles(id) ON DELETE CASCADE,
  metadata       JSONB,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE activity DISABLE ROW LEVEL SECURITY;

-- ── Drafts (research WIP) ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS drafts (
  id             SERIAL      PRIMARY KEY,
  author_address VARCHAR(50) NOT NULL,
  title          TEXT        DEFAULT '',
  sections       JSONB       DEFAULT '[]',
  refs           JSONB       DEFAULT '[]',
  keywords       TEXT[]      DEFAULT '{}',
  status         VARCHAR(20) DEFAULT 'draft',
  last_saved     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE drafts DISABLE ROW LEVEL SECURITY;

-- ── Admin roles ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_roles (
  wallet_address VARCHAR(50) PRIMARY KEY,
  role           INTEGER     NOT NULL DEFAULT 1,
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_roles DISABLE ROW LEVEL SECURITY;

-- ── Updated_at trigger for profiles ───────────────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$
LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at ON profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at();

SELECT 'Schema ready! All tables created.' AS status;

-- ── Article AI analysis ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS article_analysis (
  article_id         INTEGER PRIMARY KEY REFERENCES articles(id) ON DELETE CASCADE,
  plagiarism_score   INTEGER DEFAULT 0,     -- 0-100 (100 = definitely plagiarized)
  ai_score           INTEGER DEFAULT 0,     -- 0-100 (100 = definitely AI-generated)
  quality_score      INTEGER DEFAULT 0,     -- 0-100 (100 = excellent quality)
  originality_score  INTEGER DEFAULT 0,     -- 0-100 (100 = highly original)
  plagiarism_notes   TEXT,
  ai_notes           TEXT,
  quality_notes      TEXT,
  recommendation     VARCHAR(20) DEFAULT 'pending', -- approve/reject/review
  analyzed_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE article_analysis DISABLE ROW LEVEL SECURITY;

-- ── Earnings (tracks money owed to writers) ───────────────────────
CREATE TABLE IF NOT EXISTS earnings (
  id             SERIAL       PRIMARY KEY,
  writer_address VARCHAR(50)  NOT NULL,
  article_id     INTEGER      REFERENCES articles(id) ON DELETE SET NULL,
  reader_address VARCHAR(50)  NOT NULL,
  gross_amount   NUMERIC(18,6) NOT NULL,  -- what reader paid
  writer_amount  NUMERIC(18,6) NOT NULL,  -- writer's share (85%)
  tx_hash        VARCHAR(100),
  period         VARCHAR(7),              -- YYYY-MM (payout period)
  status         VARCHAR(20) DEFAULT 'pending', -- pending/paid
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_earnings_writer ON earnings(writer_address);
CREATE INDEX IF NOT EXISTS idx_earnings_status ON earnings(status);
ALTER TABLE earnings DISABLE ROW LEVEL SECURITY;

-- ── Payouts (processed payout records) ───────────────────────────
CREATE TABLE IF NOT EXISTS payouts (
  id             SERIAL       PRIMARY KEY,
  writer_address VARCHAR(50)  NOT NULL,
  amount         NUMERIC(18,6) NOT NULL,
  tx_hash        VARCHAR(100),
  period         VARCHAR(7),
  processed_by   VARCHAR(50),
  processed_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE payouts DISABLE ROW LEVEL SECURITY;

-- ── Notifications ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS notifications (
  id           SERIAL       PRIMARY KEY,
  user_address VARCHAR(50)  NOT NULL,
  type         VARCHAR(30)  NOT NULL,  -- comment/reaction/follow/payout/article_approved
  title        TEXT,
  body         TEXT,
  link         TEXT,
  read         BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_address);
ALTER TABLE notifications DISABLE ROW LEVEL SECURITY;

SELECT 'Schema v2 additions complete' AS status;

-- Add blockchain verification to profiles (run if profiles table already exists)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS saved_to_chain  BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS chain_signature TEXT;
