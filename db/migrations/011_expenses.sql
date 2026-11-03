-- Expense tracking: operating costs that are not inventory.
--
-- Supplies already track stock movement cost. This table tracks everything else
-- — rent, utilities, payroll, marketing — so the owner can see what the
-- restaurant actually costs to run.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  category TEXT NOT NULL,          -- rent|utilities|payroll|marketing|equipment|maintenance|other
  amount INTEGER NOT NULL,         -- kyat
  description TEXT,
  date TEXT NOT NULL,              -- YYYY-MM-DD
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(date);
CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);