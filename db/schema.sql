-- Readlearc PostgreSQL Schema
-- Run each statement ONE AT A TIME in phpPgAdmin (paste + Execute)

-- 1. Articles
CREATE TABLE IF NOT EXISTS articles (
  id             SERIAL PRIMARY KEY,
  title          TEXT NOT NULL,
  blurb          TEXT NOT NULL,
  content        TEXT NOT NULL,
  price          NUMERIC(10,6) NOT NULL DEFAULT 0.020000,
  category       VARCHAR(50)   NOT NULL DEFAULT 'General',
  read_time      INTEGER       NOT NULL DEFAULT 3,
  is_research    BOOLEAN       NOT NULL DEFAULT FALSE,
  author_address VARCHAR(42)   NOT NULL,
  status         VARCHAR(20)   NOT NULL DEFAULT 'pending',
  featured       BOOLEAN       NOT NULL DEFAULT FALSE,
  reads          INTEGER       NOT NULL DEFAULT 0,
  created_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
  updated_at     TIMESTAMPTZ   NOT NULL DEFAULT NOW()
);

-- 2. Read receipts
CREATE TABLE IF NOT EXISTS read_receipts (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reader_address VARCHAR(42) NOT NULL,
  tx_hash        VARCHAR(66),
  amount_paid    NUMERIC(10,6),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, reader_address)
);

-- 3. Comments (uses SERIAL instead of UUID — no pgcrypto needed)
CREATE TABLE IF NOT EXISTS comments (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_address VARCHAR(42) NOT NULL,
  author_name    VARCHAR(100),
  content        TEXT        NOT NULL,
  parent_id      INTEGER     REFERENCES comments(id) ON DELETE CASCADE,
  edited         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Reactions
CREATE TABLE IF NOT EXISTS reactions (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  address        VARCHAR(42) NOT NULL,
  reaction_key   VARCHAR(20) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, address)
);

-- 5. Follows
CREATE TABLE IF NOT EXISTS follows (
  id                SERIAL      PRIMARY KEY,
  follower_address  VARCHAR(42) NOT NULL,
  following_address VARCHAR(42) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);

-- 6. Auto-update function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

-- 7. Drop old trigger (if exists)
DROP TRIGGER IF EXISTS articles_updated_at ON articles;

-- 8. Create trigger
CREATE TRIGGER articles_updated_at
  BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
