-- Readlearc PostgreSQL Schema
-- Run this in your cPanel PostgreSQL database once

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

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

CREATE TABLE IF NOT EXISTS read_receipts (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  reader_address VARCHAR(42) NOT NULL,
  tx_hash        VARCHAR(66),
  amount_paid    NUMERIC(10,6),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, reader_address)
);

CREATE TABLE IF NOT EXISTS comments (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  author_address VARCHAR(42) NOT NULL,
  author_name    VARCHAR(100),
  content        TEXT        NOT NULL,
  parent_id      UUID        REFERENCES comments(id) ON DELETE CASCADE,
  edited         BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reactions (
  id             SERIAL      PRIMARY KEY,
  article_id     INTEGER     NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
  address        VARCHAR(42) NOT NULL,
  reaction_key   VARCHAR(20) NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(article_id, address)
);

CREATE TABLE IF NOT EXISTS follows (
  id                SERIAL      PRIMARY KEY,
  follower_address  VARCHAR(42) NOT NULL,
  following_address VARCHAR(42) NOT NULL,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(follower_address, following_address)
);

CREATE OR REPLACE FUNCTION update_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS articles_updated_at ON articles;
CREATE TRIGGER articles_updated_at BEFORE UPDATE ON articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
