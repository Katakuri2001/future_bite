-- Tips / gratuity: a guest can add a tip when settling a bill.
--
-- A tip is recorded against a receipt alongside its payments. A receipt can
-- have many payments (partial payments) and many tips.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

ALTER TABLE payments ADD COLUMN tip_amount INTEGER NOT NULL DEFAULT 0;

CREATE TABLE IF NOT EXISTS tips (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  receipt_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (receipt_id) REFERENCES receipts(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_tips_receipt ON tips(receipt_id);
CREATE INDEX IF NOT EXISTS idx_tips_created ON tips(created_at);