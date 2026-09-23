PRAGMA foreign_keys = ON;

-- =============================================
-- BRANCHES (single restaurant for now, but schema supports multi-branch)
-- =============================================
CREATE TABLE IF NOT EXISTS branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  email TEXT,
  timezone TEXT DEFAULT 'UTC',
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- =============================================
-- USERS (unified — customers + staff roles)
-- =============================================
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  name TEXT NOT NULL,  -- display name: first_name + last_name
  role TEXT NOT NULL DEFAULT 'customer',  -- admin|manager|kitchen|waiter|host|cashier|customer
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  points INTEGER DEFAULT 0,
  last_login_at TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_branch ON users(branch_id);

-- =============================================
-- SESSIONS (token → user_id, also backed by KV for fast lookups)
-- =============================================
CREATE TABLE IF NOT EXISTS sessions (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  expires_at TEXT NOT NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);

-- =============================================
-- MENU CATEGORIES
-- =============================================
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- =============================================
-- MENU ITEMS (dishes)
-- =============================================
CREATE TABLE IF NOT EXISTS dishes (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL,  -- in kyat (no decimals)
  image_url TEXT,
  ingredients TEXT,  -- JSON array
  allergens TEXT,     -- JSON array
  dietary TEXT,       -- JSON array
  is_available INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  preparation_time INTEGER DEFAULT 15,
  cost_price INTEGER,
  points_value INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (category_id) REFERENCES categories(id)
);
CREATE INDEX IF NOT EXISTS idx_dishes_category ON dishes(category_id);
CREATE INDEX IF NOT EXISTS idx_dishes_branch ON dishes(branch_id);
CREATE INDEX IF NOT EXISTS idx_dishes_slug ON dishes(slug);

-- =============================================
-- TABLES
-- =============================================
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  number INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  experience TEXT DEFAULT 'main',  -- window|bar|private|patio|main
  status TEXT DEFAULT 'available', -- available|reserved|seated|waiting|cleaning
  location TEXT,
  is_active INTEGER DEFAULT 1,
  -- Floor plan coordinates
  x INTEGER DEFAULT 0,
  y INTEGER DEFAULT 0,
  width INTEGER DEFAULT 80,
  height INTEGER DEFAULT 60,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_tables_number ON tables(number);
CREATE INDEX IF NOT EXISTS idx_tables_branch ON tables(branch_id);

-- =============================================
-- RESERVATIONS / BOOKINGS
-- =============================================
CREATE TABLE IF NOT EXISTS reservations (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  confirmation_code TEXT UNIQUE NOT NULL,
  customer_name TEXT NOT NULL,
  customer_email TEXT,
  customer_phone TEXT,
  date TEXT NOT NULL,
  time TEXT NOT NULL,
  party_size INTEGER NOT NULL,
  table_number INTEGER,
  experience TEXT DEFAULT 'main',
  special_requests TEXT,
  status TEXT DEFAULT 'confirmed',  -- pending|confirmed|seated|completed|cancelled|no-show
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_reservations_date ON reservations(date);
CREATE INDEX IF NOT EXISTS idx_reservations_branch ON reservations(branch_id);

-- =============================================
-- ORDERS
-- =============================================
CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  order_number TEXT UNIQUE NOT NULL,
  user_id TEXT,
  table_number INTEGER,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  service_charge INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',  -- pending|accepted|preparing|plating|ready|served|completed|cancelled
  payment_status TEXT DEFAULT 'pending',   -- pending|paid|failed|refunded
  special_instructions TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_branch ON orders(branch_id);
CREATE INDEX IF NOT EXISTS idx_orders_created ON orders(created_at);

-- =============================================
-- ORDER ITEMS
-- =============================================
CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  menu_item_id TEXT NOT NULL,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL,
  variants TEXT,  -- JSON array
  addons TEXT,    -- JSON array
  special_instructions TEXT,
  status TEXT DEFAULT 'pending',  -- pending|preparing|ready|served|cancelled
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (menu_item_id) REFERENCES dishes(id)
);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);

-- =============================================
-- KITCHEN ORDERS (derived/synced from orders table for KDS display)
-- =============================================
CREATE TABLE IF NOT EXISTS kitchen_orders (
  id TEXT PRIMARY KEY,
  order_id TEXT NOT NULL,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  order_number TEXT NOT NULL,
  table_number INTEGER,
  priority TEXT DEFAULT 'normal',  -- normal|urgent|delayed
  status TEXT DEFAULT 'pending',   -- pending|preparing|plating|ready|served|completed
  elapsed INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_status ON kitchen_orders(status);
CREATE INDEX IF NOT EXISTS idx_kitchen_orders_branch ON kitchen_orders(branch_id);

-- =============================================
-- STAFF (admin subset — also tracked in users table, this is for admin-specific metadata)
-- =============================================
CREATE TABLE IF NOT EXISTS staff (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  user_id TEXT,  -- linked to users table
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL,  -- admin|manager|kitchen|waiter|host|cashier
  phone TEXT,
  is_active INTEGER DEFAULT 1,
  shift TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_staff_branch ON staff(branch_id);

-- =============================================
-- INVENTORY / SUPPLIES
-- =============================================
CREATE TABLE IF NOT EXISTS supplies (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  name TEXT NOT NULL,
  unit TEXT NOT NULL,  -- kg|g|pcs|btl|L
  current_stock REAL DEFAULT 0,
  minimum_stock REAL DEFAULT 0,
  cost REAL DEFAULT 0,
  supplier TEXT,
  status TEXT DEFAULT 'healthy',  -- healthy|low|critical
  last_updated TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_supplies_branch ON supplies(branch_id);

-- =============================================
-- SUPPLY TRANSACTIONS (ingredients register — usage/restock/adjustment log)
-- =============================================
CREATE TABLE IF NOT EXISTS supply_transactions (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  supply_id TEXT NOT NULL,
  type TEXT NOT NULL,  -- purchase|usage|adjustment|waste
  quantity REAL NOT NULL,  -- signed: positive adds stock, negative removes stock
  unit_cost REAL,
  total_cost REAL,
  reference TEXT,       -- e.g. order number, invoice number
  notes TEXT,
  created_by TEXT,      -- staff name or user id
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_supply_tx_supply ON supply_transactions(supply_id);
CREATE INDEX IF NOT EXISTS idx_supply_tx_created ON supply_transactions(created_at);

-- =============================================
-- TESTIMONIALS / RATINGS
-- =============================================
CREATE TABLE IF NOT EXISTS ratings (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  user_id TEXT,
  name TEXT NOT NULL,
  rating INTEGER NOT NULL CHECK(rating >= 1 AND rating <= 5),
  text TEXT,
  date TEXT,
  is_public INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);

-- =============================================
-- COUNTERS (for confirmation codes, order numbers)
-- =============================================
CREATE TABLE IF NOT EXISTS counters (
  name TEXT PRIMARY KEY,
  value INTEGER NOT NULL DEFAULT 0
);

-- =============================================
-- DAILY SALES (for analytics)
-- =============================================
CREATE TABLE IF NOT EXISTS daily_sales (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  date TEXT NOT NULL,
  total_orders INTEGER DEFAULT 0,
  total_revenue INTEGER DEFAULT 0,
  total_customers INTEGER DEFAULT 0,
  average_order_value INTEGER DEFAULT 0,
  peak_hour INTEGER,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(branch_id, date)
);

-- =============================================
-- RECEIPTS (POS — E-receipts & physical receipts)
-- A receipt is created at POS checkout and is the source of truth for
-- revenue + receipt counts in the admin dashboard (daily/weekly/monthly).
-- =============================================
CREATE TABLE IF NOT EXISTS receipts (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  receipt_no TEXT UNIQUE NOT NULL,
  order_id TEXT,
  order_number TEXT,
  customer_name TEXT,
  table_number INTEGER,
  subtotal INTEGER NOT NULL DEFAULT 0,
  tax INTEGER NOT NULL DEFAULT 0,
  service_charge INTEGER NOT NULL DEFAULT 0,
  total INTEGER NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT 'cash',  -- cash|card|qr
  receipt_type TEXT DEFAULT 'e',       -- e|physical
  created_by TEXT,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id),
  FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_receipts_created ON receipts(created_at);
CREATE INDEX IF NOT EXISTS idx_receipts_branch ON receipts(branch_id);
CREATE INDEX IF NOT EXISTS idx_receipts_order ON receipts(order_id);

-- =============================================
-- MENU SETS (named sets of dishes — tasting menus / combos)
-- =============================================
CREATE TABLE IF NOT EXISTS menu_sets (
  id TEXT PRIMARY KEY,
  branch_id TEXT NOT NULL DEFAULT 'default-branch',
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  price INTEGER NOT NULL DEFAULT 0,  -- 0 = computed from set items
  image_url TEXT,
  is_available INTEGER DEFAULT 1,
  is_featured INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (branch_id) REFERENCES branches(id)
);
CREATE INDEX IF NOT EXISTS idx_menu_sets_branch ON menu_sets(branch_id);

-- =============================================
-- MENU SET ITEMS (dishes inside a menu set)
-- =============================================
CREATE TABLE IF NOT EXISTS menu_set_items (
  id TEXT PRIMARY KEY,
  menu_set_id TEXT NOT NULL,
  dish_id TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  display_order INTEGER DEFAULT 0,
  FOREIGN KEY (menu_set_id) REFERENCES menu_sets(id) ON DELETE CASCADE,
  FOREIGN KEY (dish_id) REFERENCES dishes(id)
);
CREATE INDEX IF NOT EXISTS idx_menu_set_items_set ON menu_set_items(menu_set_id);
CREATE INDEX IF NOT EXISTS idx_menu_set_items_dish ON menu_set_items(dish_id);
