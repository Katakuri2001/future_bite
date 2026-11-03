-- Waitlist: guests who arrive when no table is free.
--
-- A restaurant that is full should not turn people away; it should take a name
-- and a party size and seat them when something opens up.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE TABLE IF NOT EXISTS waitlist (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  name TEXT NOT NULL,
  phone TEXT,
  party_size INTEGER NOT NULL DEFAULT 2,
  preferred_time TEXT,
  experience TEXT DEFAULT 'standard',   -- standard|premium|vip
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting|seated|cancelled|no-show
  seated_table INTEGER,
  seated_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created ON waitlist(created_at);