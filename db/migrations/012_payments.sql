-- Partial payments: a bill can be settled in more than one transaction.
--
-- A guest who pays part in cash and part by card, or who settles a large
-- table in instalments, needs the bill to track what has been received rather
-- than flipping from unpaid to paid in one step.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE TABLE IF NOT EXISTS payments (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  receipt_id TEXT NOT NULL,
  amount INTEGER NOT NULL,            -- kyat
  method TEXT NOT NULL DEFAULT 'cash', -- cash|card|qr
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_payments_receipt ON payments(receipt_id);