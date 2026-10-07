PRAGMA foreign_keys = ON;

-- Seed categories
INSERT OR IGNORE INTO categories (id, branch_id, name, slug, description, display_order, is_active)
VALUES 
  ('cat-starters', 'default-branch', 'Starters', 'starters', 'Small plates to begin your meal', 1, 1),
  ('cat-mains', 'default-branch', 'Mains', 'mains', 'Hearty dishes', 2, 1),
  ('cat-desserts', 'default-branch', 'Desserts', 'desserts', 'Sweet endings', 3, 1),
  ('cat-drinks', 'default-branch', 'Drinks', 'drinks', 'Beverages', 4, 1);

-- Seed dishes
INSERT OR IGNORE INTO dishes (id, branch_id, category_id, name, slug, description, price, image_url, ingredients, allergens, dietary, is_available, is_featured, preparation_time, cost_price, points_value, display_order)
VALUES 
  ('dish-001', 'default-branch', 'cat-starters', 'Truffle Fries', 'truffle-fries', 'Crispy fries with truffle oil and parmesan', 12500, '', '["potato","truffle oil","parmesan"]', '["dairy"]', '["vegetarian"]', 1, 1, 10, 5000, 12, 1),
  ('dish-002', 'default-branch', 'cat-starters', 'Crispy Calamari', 'crispy-calamari', 'Golden fried calamari with aioli', 16000, '', '["calamari","flour","aioli"]', '["gluten","seafood"]', '[]', 1, 0, 8, 7000, 16, 2),
  ('dish-003', 'default-branch', 'cat-mains', 'Wagyu Burger', 'wagyu-burger', 'Premium wagyu beef with caramelized onions', 35000, '', '["wagyu","bun","onion","cheese"]', '["gluten","dairy"]', '[]', 1, 1, 15, 18000, 35, 3),
  ('dish-004', 'default-branch', 'cat-mains', 'Salmon Steak', 'salmon-steak', 'Grilled salmon with lemon butter sauce', 42000, '', '["salmon","lemon","butter"]', '["dairy","seafood"]', '["gluten-free"]', 1, 1, 12, 22000, 42, 4),
  ('dish-005', 'default-branch', 'cat-mains', 'Pasta Carbonara', 'pasta-carbonara', 'Creamy pasta with pancetta and egg', 28000, '', '["pasta","pancetta","egg","cream"]', '["gluten","dairy","egg"]', '[]', 1, 0, 12, 12000, 28, 5),
  ('dish-006', 'default-branch', 'cat-desserts', 'Chocolate Fondant', 'chocolate-fondant', 'Warm chocolate cake with molten center', 15000, '', '["chocolate","butter","egg","sugar"]', '["gluten","dairy","egg"]', '["vegetarian"]', 1, 1, 10, 6000, 15, 6),
  ('dish-007', 'default-branch', 'cat-drinks', 'Fresh Lemonade', 'fresh-lemonade', 'House-made lemonade with mint', 8000, '', '["lemon","sugar","mint"]', '[]', '["vegan","gluten-free"]', 1, 0, 3, 2000, 8, 7),
  ('dish-008', 'default-branch', 'cat-drinks', 'Iced Coffee', 'iced-coffee', 'Cold brew with oat milk option', 9000, '', '["coffee","milk"]', '["dairy"]', '[]', 1, 0, 3, 3000, 9, 8);

-- Seed tables
INSERT OR IGNORE INTO tables (id, branch_id, number, capacity, experience, status, location, x, y, width, height)
VALUES 
  ('tbl-1', 'default-branch', 1, 2, 'window', 'available', 'Window side', 50, 50, 80, 60),
  ('tbl-2', 'default-branch', 2, 4, 'main', 'available', 'Main hall', 200, 50, 80, 60),
  ('tbl-3', 'default-branch', 3, 2, 'bar', 'available', 'Bar area', 50, 200, 80, 60),
  ('tbl-4', 'default-branch', 4, 6, 'private', 'available', 'Private room', 200, 200, 100, 80),
  ('tbl-5', 'default-branch', 5, 4, 'patio', 'available', 'Patio', 350, 100, 80, 60);

-- Seed supplies
INSERT OR IGNORE INTO supplies (id, branch_id, name, unit, current_stock, minimum_stock, cost, supplier, status)
VALUES 
  ('sup-1', 'default-branch', 'Wagyu Beef', 'kg', 15, 5, 45000, 'Prime Meats', 'healthy'),
  ('sup-2', 'default-branch', 'Salmon Fillet', 'kg', 8, 3, 35000, 'Ocean Fresh', 'healthy'),
  ('sup-3', 'default-branch', 'Pasta', 'kg', 20, 5, 8000, 'Italian Direct', 'healthy'),
  ('sup-4', 'default-branch', 'Truffle Oil', 'btl', 4, 2, 120000, 'Specialty Goods', 'low'),
  ('sup-5', 'default-branch', 'Chocolate', 'kg', 6, 3, 25000, 'Cocoa House', 'healthy');

-- Seed demo users (password_hash will be set by application on first use; this is a placeholder)
-- The actual working demo accounts are created via /api/auth/register or by
-- running the seed script below from the Next.js app.
