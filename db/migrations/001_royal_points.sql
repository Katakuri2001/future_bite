-- Royal User Points Reward System Migration
-- Run: npx wrangler d1 execute futurebite-db --local --file=db/migrations/001_royal_points.sql

PRAGMA foreign_keys = ON;

-- Add total_spent column to users (if not exists)
ALTER TABLE users ADD COLUMN total_spent INTEGER DEFAULT 0;

-- COUPONS
CREATE TABLE IF NOT EXISTS coupons (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  user_id TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  amount INTEGER NOT NULL DEFAULT 1000,
  is_used INTEGER DEFAULT 0,
  expires_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_coupons_user ON coupons(user_id);

-- LOYALTY EVENTS
CREATE TABLE IF NOT EXISTS loyalty_events (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  user_id TEXT NOT NULL,
  order_id TEXT,
  points_earned INTEGER DEFAULT 0,
  coupon_code TEXT,
  reason TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_loyalty_user ON loyalty_events(user_id);
