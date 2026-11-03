-- Refunds: reverse a settled payment.
--
-- A restaurant that cannot correct a mistake cannot operate: a guest who was
-- charged twice, or who sends a dish back, needs the money returned and the
-- loyalty ledger put back the way it was.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE TABLE IF NOT EXISTS refunds (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  order_id TEXT NOT NULL,
  receipt_id TEXT,
  amount INTEGER NOT NULL,            -- kyat, the total refunded
  reason TEXT,
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_created ON refunds(created_at);

-- A refund reverses points and total_spent, and releases a coupon that was
-- spent on the original bill. `orders.refunded_at` records when.
ALTER TABLE orders ADD COLUMN refunded_at TEXT;
ALTER TABLE orders ADD COLUMN refunded_by TEXT;
ALTER TABLE orders ADD COLUMN refund_reason TEXT;