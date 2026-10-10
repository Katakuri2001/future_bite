-- Royal Points: coupon redemption support
-- Run: npx wrangler d1 execute futurebite-db --local  --file=db/migrations/002_coupon_redemption.sql
-- Run: npx wrangler d1 execute futurebite-db --remote --file=db/migrations/002_coupon_redemption.sql

PRAGMA foreign_keys = OFF;

-- Record which coupon discounted an order, and how much it was worth.
-- D1/SQLite cannot add a column with a non-constant default, so add it nullable
-- then backfill.
ALTER TABLE orders ADD COLUMN discount INTEGER;
ALTER TABLE orders ADD COLUMN coupon_code TEXT;

UPDATE orders SET discount = 0 WHERE discount IS NULL;

-- Track point spend when a coupon is redeemed.
ALTER TABLE loyalty_events ADD COLUMN points_redeemed INTEGER;

UPDATE loyalty_events SET points_redeemed = 0 WHERE points_redeemed IS NULL;

-- Look up a customer's coupons by code when validating at checkout.
CREATE INDEX IF NOT EXISTS idx_coupons_user_used ON coupons(user_id, is_used);

PRAGMA foreign_keys = ON;