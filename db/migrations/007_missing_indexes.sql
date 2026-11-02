-- Indexes the audit found missing on hot paths.
--
-- Several queries were doing full-table scans because the column they filtered
-- on had no index: every account-page load, every waiter/settle lookup, every
-- reservation availability check, and every kitchen ticket lookup.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE INDEX IF NOT EXISTS idx_orders_user ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_table_payment ON orders(table_number, payment_status);
CREATE INDEX IF NOT EXISTS idx_reservations_email ON reservations(customer_email);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_order ON kitchen_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_menuitem ON order_items(menu_item_id);