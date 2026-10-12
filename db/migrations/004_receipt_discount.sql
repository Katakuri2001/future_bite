-- Receipt discount visibility.
--
-- A guest who spends a coupon gets a lower total, but the receipt could not
-- say so: `receipts` had no discount column, so the slip showed a reduced
-- subtotal with no explanation of why. `orders` already carried these columns;
-- this brings the printed record in line.
--
-- Run: npx wrangler d1 execute futurebite-db --local --command="<contents>"
-- (see db/REMOTE-MIGRATION.md -- `--file` does not work in this environment)

ALTER TABLE receipts ADD COLUMN discount INTEGER NOT NULL DEFAULT 0;
ALTER TABLE receipts ADD COLUMN coupon_code TEXT;

-- Historic receipts genuinely carried no discount, so 0 is the truthful
-- default rather than a placeholder.