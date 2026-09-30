-- ═══════════════════════════════════════════════════════════════════
--  READLEARC V4 — Video + Streaming + Subscription additions
--  Run AFTER schema.sql (which creates articles, read_receipts, etc.)
--  Paste into Supabase → SQL Editor → Run
-- ═══════════════════════════════════════════════════════════════════

-- ── Videos ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS videos (
  id                  SERIAL          PRIMARY KEY,
  slug                VARCHAR(120)    NOT NULL UNIQUE,
  title               TEXT            NOT NULL,
  blurb               TEXT            NOT NULL DEFAULT '',
  creator_address     VARCHAR(50)     NOT NULL,
  price_per_sec_usdc  NUMERIC(12,8)   NOT NULL DEFAULT 0.0001,  -- 0 = free
  free_preview_secs   INTEGER         NOT NULL DEFAULT 30,
  duration_seconds    INTEGER         NOT NULL DEFAULT 0,
  hls_master_url      TEXT            NOT NULL DEFAULT '',
  thumbnail_url       TEXT,
  category            VARCHAR(50)     NOT NULL DEFAULT 'General',
  status              VARCHAR(20)     NOT NULL DEFAULT 'pending',   -- pending | approved | rejected
  featured            BOOLEAN         NOT NULL DEFAULT FALSE,
  views               INTEGER         NOT NULL DEFAULT 0,
  total_seconds_sold  BIGINT          NOT NULL DEFAULT 0,
  created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW()
);
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;

CREATE TRIGGER videos_updated_at
  BEFORE UPDATE ON videos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ── Streaming sessions ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS stream_sessions (
  id                VARCHAR(66)   PRIMARY KEY,           -- bytes32 sessionId from StreamPay contract
  viewer_address    VARCHAR(50)   NOT NULL,
  creator_address   VARCHAR(50)   NOT NULL,
  video_slug        VARCHAR(120)  NOT NULL,
  deposit_native    NUMERIC(36,0) NOT NULL DEFAULT 0,    -- native USDC (18 dec) as integer string
  rate_per_sec_native NUMERIC(36,0) NOT NULL DEFAULT 0,
  session_key       VARCHAR(50)   NOT NULL,              -- ephemeral public key
  open_tx_hash      VARCHAR(66),
  close_tx_hash     VARCHAR(66),
  amount_owed_native NUMERIC(36,0) NOT NULL DEFAULT 0,  -- last accepted voucher amount
  seconds_watched   INTEGER       NOT NULL DEFAULT 0,
  status            VARCHAR(20)   NOT NULL DEFAULT 'open',   -- open | closed | reclaimed
  opened_at         TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  closed_at         TIMESTAMPTZ
);
ALTER TABLE stream_sessions DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_stream_sessions_viewer   ON stream_sessions(viewer_address);
CREATE INDEX idx_stream_sessions_creator  ON stream_sessions(creator_address);
CREATE INDEX idx_stream_sessions_video    ON stream_sessions(video_slug);

-- ── Subscriptions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS subscriptions (
  id               SERIAL        PRIMARY KEY,
  creator_address  VARCHAR(50)   NOT NULL,
  subscriber_address VARCHAR(50) NOT NULL,
  plan             VARCHAR(20)   NOT NULL DEFAULT 'monthly',  -- monthly | yearly
  amount_usdc      NUMERIC(10,6) NOT NULL DEFAULT 0,
  tx_hash          VARCHAR(66),
  expiry           TIMESTAMPTZ   NOT NULL,
  on_chain_expiry  BIGINT,                                    -- Unix timestamp stored on-chain
  status           VARCHAR(20)   NOT NULL DEFAULT 'active',   -- active | expired | cancelled
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  UNIQUE(creator_address, subscriber_address)
);
ALTER TABLE subscriptions DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_subs_creator    ON subscriptions(creator_address);
CREATE INDEX idx_subs_subscriber ON subscriptions(subscriber_address);

-- ── Video earnings (mirrors earnings table but per-second) ─────────
CREATE TABLE IF NOT EXISTS video_earnings (
  id                SERIAL        PRIMARY KEY,
  creator_address   VARCHAR(50)   NOT NULL,
  video_slug        VARCHAR(120),
  session_id        VARCHAR(66),
  viewer_address    VARCHAR(50),
  seconds_watched   INTEGER       NOT NULL DEFAULT 0,
  gross_usdc        NUMERIC(12,8) NOT NULL DEFAULT 0,  -- total paid (6-dec USDC display)
  creator_usdc      NUMERIC(12,8) NOT NULL DEFAULT 0,
  tx_hash           VARCHAR(66),
  period            VARCHAR(7),   -- YYYY-MM
  status            VARCHAR(20)   NOT NULL DEFAULT 'settled',  -- settled | pending
  created_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE video_earnings DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_ve_creator ON video_earnings(creator_address);
CREATE INDEX idx_ve_session ON video_earnings(session_id);

-- ── Subscription price config (per creator) ────────────────────────
CREATE TABLE IF NOT EXISTS creator_subscriptions (
  creator_address   VARCHAR(50)   PRIMARY KEY,
  monthly_price_usdc NUMERIC(10,6) NOT NULL DEFAULT 5.000000,   -- 0 = free
  yearly_price_usdc  NUMERIC(10,6) NOT NULL DEFAULT 50.000000,  -- 0 = free
  enabled           BOOLEAN       NOT NULL DEFAULT TRUE,
  updated_at        TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE creator_subscriptions DISABLE ROW LEVEL SECURITY;

-- ── Tips ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tips (
  id               SERIAL        PRIMARY KEY,
  from_address     VARCHAR(50)   NOT NULL,
  to_address       VARCHAR(50)   NOT NULL,
  amount_usdc      NUMERIC(10,6) NOT NULL DEFAULT 0,
  content_id       VARCHAR(66),  -- bytes32 content id (articles or videos)
  content_type     VARCHAR(20),  -- 'article' | 'video'
  tx_hash          VARCHAR(66),
  created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);
ALTER TABLE tips DISABLE ROW LEVEL SECURITY;
CREATE INDEX idx_tips_to ON tips(to_address);

-- ── Extend earnings table to track period/status if missing ────────
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS period  VARCHAR(7);
ALTER TABLE earnings ADD COLUMN IF NOT EXISTS status  VARCHAR(20) NOT NULL DEFAULT 'pending';
