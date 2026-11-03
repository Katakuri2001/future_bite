-- Recipe links: which supplies a dish consumes, and how much.
--
-- `dishes.ingredients` is a JSON array of free-text names with no link to the
-- supplies register, so selling a dish never moved stock. A recipe is an
-- optional link: a dish with no recipe simply does not decrement anything,
-- which keeps the feature backward-compatible with the existing catalogue.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

CREATE TABLE IF NOT EXISTS dish_supplies (
  dish_id TEXT NOT NULL,
  supply_id TEXT NOT NULL,
  quantity REAL NOT NULL DEFAULT 1,   -- how much of this supply one serving uses
  PRIMARY KEY (dish_id, supply_id),
  FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
  FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dish_supplies_dish ON dish_supplies(dish_id);
CREATE INDEX IF NOT EXISTS idx_dish_supplies_supply ON dish_supplies(supply_id);