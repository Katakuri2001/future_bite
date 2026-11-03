-- Delivery and takeaway support.
--
-- Until now every order was implicitly dine-in: `table_number` was optional and
-- the POS input said "Takeaway", but there was no order type, no address, and
-- no delivery fee. A restaurant that delivers needs to know what kind of order
-- it is and where to send it.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

ALTER TABLE orders ADD COLUMN order_type TEXT NOT NULL DEFAULT 'dine-in';
ALTER TABLE orders ADD COLUMN delivery_address TEXT;
ALTER TABLE orders ADD COLUMN delivery_fee INTEGER NOT NULL DEFAULT 0;
ALTER TABLE orders ADD COLUMN delivery_status TEXT;  -- preparing|out-for-delivery|delivered

CREATE INDEX IF NOT EXISTS idx_orders_type ON orders(order_type);