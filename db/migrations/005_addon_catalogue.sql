-- Addon catalogue.
--
-- `pos/checkout` used to sum `addons[].price` straight off the request body,
-- so a crafted request could set its own prices on a live payment endpoint.
-- Dish prices were always re-resolved from the database; addon prices were not.
-- An addon is now an entity the server prices, and the client sends only an id.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE TABLE IF NOT EXISTS addons (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,          -- kyat, no decimals
  is_available INTEGER NOT NULL DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE INDEX IF NOT EXISTS idx_addons_available ON addons(is_available);

-- Seeded from the extras the POS previously let a client type in freehand.
INSERT OR IGNORE INTO addons (id, name, price) VALUES
  ('addon-egg',            'Extra egg',                 1500),
  ('addon-rare',           'Rare finish',               2500),
  ('addon-caviar',         'Oscietra caviar',           8500),
  ('addon-truffle',        'Black truffle',             6500),
  ('addon-sub',            'Substitute starch',          500),
  ('addon-sauce',          'Sauce on the side',         800),
  ('addon-gluten-free',    'Gluten-free preparation',   1200),
  ('addon-no-onion',       'No onion',                   0);