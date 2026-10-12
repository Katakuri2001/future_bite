-- Receipt lifecycle: a bill that can exist before it is paid.
--
-- Until now a receipt was only ever created atomically with payment, so every
-- receipt in the table was already paid and "mark it paid" had nothing to act
-- on. A cashier could not issue a bill for a table and take the money later,
-- which is how a restaurant actually closes out a table.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

-- unpaid | paid | void
--
-- `DEFAULT 'paid'` is truthful, not a placeholder: every existing receipt was
-- created in the same batch that marked its order paid.
ALTER TABLE receipts ADD COLUMN status TEXT NOT NULL DEFAULT 'paid';

ALTER TABLE receipts ADD COLUMN billed_at TEXT;
ALTER TABLE receipts ADD COLUMN paid_at TEXT;
ALTER TABLE receipts ADD COLUMN issued_by TEXT;
ALTER TABLE receipts ADD COLUMN voided_at TEXT;
ALTER TABLE receipts ADD COLUMN void_reason TEXT;

-- Royal points earned on this bill, and the balance it left behind. Storing
-- the balance means a reprint still shows what the guest actually had, even
-- after their balance has since moved on.
ALTER TABLE receipts ADD COLUMN points_earned INTEGER NOT NULL DEFAULT 0;
ALTER TABLE receipts ADD COLUMN points_balance INTEGER;

-- The cashier needs to find unpaid bills by table without scanning the
-- register, and the register needs to list a table's history.
CREATE INDEX IF NOT EXISTS idx_receipts_status_table
  ON receipts(status, table_number);
CREATE INDEX IF NOT EXISTS idx_receipts_table
  ON receipts(table_number, created_at);

-- Backfill: anything already in the table was paid at creation.
UPDATE receipts SET status = 'paid' WHERE status IS NULL;