-- Admin Roles table (add to Supabase SQL Editor)
CREATE TABLE IF NOT EXISTS admin_roles (
  wallet_address VARCHAR(50) PRIMARY KEY,
  role           INTEGER     NOT NULL DEFAULT 1,
  granted_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE admin_roles DISABLE ROW LEVEL SECURITY;

-- Foreign key to profiles (optional)
-- ALTER TABLE admin_roles ADD CONSTRAINT fk_profile FOREIGN KEY (wallet_address) REFERENCES profiles(wallet_address) ON DELETE CASCADE;
