-- Waiter service: per-dish served tracking
-- Run: npx wrangler d1 execute futurebite-db --local  --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)
--
-- The waiter carries a dish from the pass to the table, so "served" is an
-- event that happens per dish, not per order. `order_items.created_at` already
-- records when a dish was ordered; these columns record when it reached the
-- guest. Ordered -> served duration is then a simple subtraction.

ALTER TABLE order_items ADD COLUMN served_at TEXT;
ALTER TABLE order_items ADD COLUMN served_by TEXT;

-- Lets the waiter dashboard find "dishes ready to run" and "recently served"
-- without scanning every order.
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);
CREATE INDEX IF NOT EXISTS idx_order_items_served_at ON order_items(served_at);

-- Which waiter opened a table order (audit; lets the floor be reconstructed).
ALTER TABLE orders ADD COLUMN opened_by TEXT;