-- Enterprise Restaurant Ecosystem - D1 Database Schema
-- Designed for Cloudflare D1 (SQLite) with enterprise-grade constraints

-- Enable foreign key constraints
PRAGMA foreign_keys = ON;

-- =============================================
-- CORE ENTITIES
-- =============================================

-- Branches table for multi-restaurant support
CREATE TABLE branches (
    id TEXT PRIMARY KEY,                    -- UUID
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    timezone TEXT DEFAULT 'UTC',
    currency TEXT DEFAULT 'USD',
    settings TEXT,                         -- JSON for branch-specific settings
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users table (customers)
CREATE TABLE users (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE,
    password_hash TEXT NOT NULL,            -- bcrypt hash
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,           -- Encrypted QR reference
    barcode TEXT UNIQUE NOT NULL,           -- Unique barcode
    points INTEGER DEFAULT 0,               -- Loyalty points
    is_verified BOOLEAN DEFAULT false,
    is_suspended BOOLEAN DEFAULT false,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Admin users table
CREATE TABLE admins (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,            -- bcrypt hash
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('super_admin', 'admin', 'staff')),
    permissions TEXT,                       -- JSON for granular permissions
    is_active BOOLEAN DEFAULT true,
    last_login_at DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- =============================================
-- MENU & INVENTORY
-- =============================================

-- Categories for dishes
CREATE TABLE categories (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    display_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Dishes/Menu items
CREATE TABLE dishes (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    category_id TEXT NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    cost_price DECIMAL(10,2),               -- For profit calculations
    points_value INTEGER DEFAULT 0,          -- Loyalty points per dish
    preparation_time INTEGER DEFAULT 0,     -- Minutes
    image_url TEXT,                         -- R2 storage URL
    allergens TEXT,                         -- JSON array
    nutritional_info TEXT,                   -- JSON object
    is_available BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT
);

-- Restaurant tables
CREATE TABLE tables (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    table_number TEXT NOT NULL,
    capacity INTEGER NOT NULL,
    qr_code TEXT UNIQUE NOT NULL,           -- Encrypted QR token
    location TEXT,                          -- e.g., 'Indoor', 'Patio', 'VIP'
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- =============================================
-- ORDERS & ORDERING
-- =============================================

-- Orders table
CREATE TABLE orders (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    user_id TEXT,                           -- NULL for guest orders
    table_id TEXT,
    order_number TEXT UNIQUE NOT NULL,      -- Human-readable order number
    status TEXT NOT NULL DEFAULT 'pending' CHECK (
        status IN ('pending', 'accepted', 'cooking', 'ready', 'completed', 'cancelled')
    ),
    subtotal DECIMAL(10,2) NOT NULL,
    tax_amount DECIMAL(10,2) DEFAULT 0,
    discount_amount DECIMAL(10,2) DEFAULT 0,
    total_amount DECIMAL(10,2) NOT NULL,
    payment_status TEXT DEFAULT 'pending' CHECK (
        payment_status IN ('pending', 'paid', 'refunded', 'failed')
    ),
    payment_method TEXT,                    -- 'cash', 'card', 'digital'
    special_instructions TEXT,
    idempotency_key TEXT UNIQUE,            -- For duplicate prevention
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

-- Order items (line items)
CREATE TABLE order_items (
    id TEXT PRIMARY KEY,                    -- UUID
    order_id TEXT NOT NULL,
    dish_id TEXT NOT NULL,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    subtotal DECIMAL(10,2) NOT NULL,
    special_instructions TEXT,
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'preparing', 'ready', 'served', 'cancelled')
    ),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE RESTRICT
);

-- =============================================
-- BOOKINGS & RESERVATIONS
-- =============================================

-- Bookings table
CREATE TABLE bookings (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    table_id TEXT,
    party_size INTEGER NOT NULL CHECK (party_size > 0),
    booking_date DATE NOT NULL,
    booking_time TIME NOT NULL,
    duration_minutes INTEGER DEFAULT 120,   -- Default 2 hours
    status TEXT DEFAULT 'pending' CHECK (
        status IN ('pending', 'approved', 'cancelled', 'expired', 'completed', 'no_show')
    ),
    special_requests TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    reminder_sent BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (table_id) REFERENCES tables(id) ON DELETE SET NULL
);

-- =============================================
-- LOYALTY & REWARDS
-- =============================================

-- Loyalty transactions
CREATE TABLE loyalty_transactions (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_id TEXT,                          -- Associated order if applicable
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN ('earned', 'redeemed', 'expired', 'adjusted')
    ),
    points INTEGER NOT NULL,                -- Positive for earned, negative for redeemed
    balance_after INTEGER NOT NULL,         -- User balance after transaction
    reference TEXT,                          -- Order ID, manual adjustment, etc.
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL
);

-- =============================================
-- INVENTORY & SUPPLY CHAIN
-- =============================================

-- Suppliers
CREATE TABLE suppliers (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    name TEXT NOT NULL,
    contact_person TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    payment_terms TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE
);

-- Supplies/Inventory items
CREATE TABLE supplies (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    supplier_id TEXT,
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category TEXT,
    unit TEXT NOT NULL,                     -- e.g., 'kg', 'liters', 'pieces'
    current_stock DECIMAL(10,2) DEFAULT 0,
    min_stock_level DECIMAL(10,2) DEFAULT 0,
    max_stock_level DECIMAL(10,2),
    unit_cost DECIMAL(10,2),
    last_restocked_at DATETIME,
    is_active BOOLEAN DEFAULT true,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id) ON DELETE SET NULL
);

-- Supply transactions
CREATE TABLE supply_transactions (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    supply_id TEXT NOT NULL,
    transaction_type TEXT NOT NULL CHECK (
        transaction_type IN ('purchase', 'usage', 'adjustment', 'waste')
    ),
    quantity DECIMAL(10,2) NOT NULL,        -- Positive for incoming, negative for outgoing
    unit_cost DECIMAL(10,2),
    total_cost DECIMAL(10,2),
    reference TEXT,                         -- Order ID, waste report, etc.
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (supply_id) REFERENCES supplies(id) ON DELETE CASCADE
);

-- =============================================
-- RATINGS & FEEDBACK
-- =============================================

-- Ratings
CREATE TABLE ratings (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    order_id TEXT,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    is_public BOOLEAN DEFAULT false,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL,
    
    -- Prevent duplicate ratings for same order
    UNIQUE(user_id, order_id)
);

-- =============================================
-- ANALYTICS & BUSINESS INTELLIGENCE
-- =============================================

-- Daily sales summary
CREATE TABLE daily_sales (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    date DATE NOT NULL,
    total_orders INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_customers INTEGER DEFAULT 0,
    total_discounts DECIMAL(10,2) DEFAULT 0,
    total_tax DECIMAL(10,2) DEFAULT 0,
    average_order_value DECIMAL(10,2) DEFAULT 0,
    peak_hour INTEGER,                      -- Hour with most orders (0-23)
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    
    UNIQUE(branch_id, date)
);

-- Dish performance analytics
CREATE TABLE dish_analytics (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    dish_id TEXT NOT NULL,
    date DATE NOT NULL,
    times_ordered INTEGER DEFAULT 0,
    total_revenue DECIMAL(10,2) DEFAULT 0,
    total_cost DECIMAL(10,2) DEFAULT 0,
    profit_margin DECIMAL(5,2) DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
    
    UNIQUE(branch_id, dish_id, date)
);

-- =============================================
-- SYSTEM & AUDIT
-- =============================================

-- Audit logs for security and compliance
CREATE TABLE audit_logs (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    user_id TEXT,                           -- Can be admin or customer
    admin_id TEXT,                          -- Admin who performed action
    action TEXT NOT NULL,                   -- 'create', 'update', 'delete', 'login', etc.
    resource_type TEXT NOT NULL,            -- 'order', 'user', 'dish', etc.
    resource_id TEXT,                       -- ID of affected resource
    old_values TEXT,                        -- JSON of previous state
    new_values TEXT,                        -- JSON of new state
    ip_address TEXT,
    user_agent TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    FOREIGN KEY (admin_id) REFERENCES admins(id) ON DELETE SET NULL
);

-- System configuration
CREATE TABLE system_config (
    id TEXT PRIMARY KEY,                    -- UUID
    branch_id TEXT NOT NULL,
    key TEXT NOT NULL,
    value TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT false,       -- Whether config is exposed to frontend
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    
    FOREIGN KEY (branch_id) REFERENCES branches(id) ON DELETE CASCADE,
    
    UNIQUE(branch_id, key)
);

-- =============================================
-- INDEXES FOR PERFORMANCE
-- =============================================

-- Users indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_qr_code ON users(qr_code);
CREATE INDEX idx_users_barcode ON users(barcode);
CREATE INDEX idx_users_branch_id ON users(branch_id);

-- Admins indexes
CREATE INDEX idx_admins_email ON admins(email);
CREATE INDEX idx_admins_branch_id ON admins(branch_id);
CREATE INDEX idx_admins_role ON admins(role);

-- Dishes indexes
CREATE INDEX idx_dishes_branch_id ON dishes(branch_id);
CREATE INDEX idx_dishes_category_id ON dishes(category_id);
CREATE INDEX idx_dishes_is_available ON dishes(is_available);
CREATE INDEX idx_dishes_is_featured ON dishes(is_featured);

-- Orders indexes
CREATE INDEX idx_orders_branch_id ON orders(branch_id);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_table_id ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_payment_status ON orders(payment_status);

-- Order items indexes
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_dish_id ON order_items(dish_id);

-- Bookings indexes
CREATE INDEX idx_bookings_branch_id ON bookings(branch_id);
CREATE INDEX idx_bookings_user_id ON bookings(user_id);
CREATE INDEX idx_bookings_table_id ON bookings(table_id);
CREATE INDEX idx_bookings_date ON bookings(booking_date);
CREATE INDEX idx_bookings_status ON bookings(status);

-- Loyalty transactions indexes
CREATE INDEX idx_loyalty_transactions_branch_id ON loyalty_transactions(branch_id);
CREATE INDEX idx_loyalty_transactions_user_id ON loyalty_transactions(user_id);
CREATE INDEX idx_loyalty_transactions_created_at ON loyalty_transactions(created_at);

-- Supplies indexes
CREATE INDEX idx_supplies_branch_id ON supplies(branch_id);
CREATE INDEX idx_supplies_supplier_id ON supplies(supplier_id);
CREATE INDEX idx_supplies_current_stock ON supplies(current_stock);

-- Analytics indexes
CREATE INDEX idx_daily_sales_branch_id ON daily_sales(branch_id);
CREATE INDEX idx_daily_sales_date ON daily_sales(date);
CREATE INDEX idx_dish_analytics_branch_id ON dish_analytics(branch_id);
CREATE INDEX idx_dish_analytics_dish_id ON dish_analytics(dish_id);
CREATE INDEX idx_dish_analytics_date ON dish_analytics(date);

-- Audit logs indexes
CREATE INDEX idx_audit_logs_branch_id ON audit_logs(branch_id);
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_admin_id ON audit_logs(admin_id);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_resource_type ON audit_logs(resource_type);

-- =============================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- =============================================

-- Update updated_at timestamp trigger
CREATE TRIGGER update_users_timestamp 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_admins_timestamp 
    AFTER UPDATE ON admins
    BEGIN
        UPDATE admins SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_dishes_timestamp 
    AFTER UPDATE ON dishes
    BEGIN
        UPDATE dishes SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_orders_timestamp 
    AFTER UPDATE ON orders
    BEGIN
        UPDATE orders SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

CREATE TRIGGER update_order_items_timestamp 
    AFTER UPDATE ON order_items
    BEGIN
        UPDATE order_items SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;

-- =============================================
-- VIEWS FOR COMMON QUERIES
-- =============================================

-- Order summary view
CREATE VIEW order_summary AS
SELECT 
    o.id,
    o.order_number,
    o.status,
    o.total_amount,
    o.created_at,
    u.first_name || ' ' || u.last_name as customer_name,
    t.table_number,
    COUNT(oi.id) as item_count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN tables t ON o.table_id = t.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id;

-- Daily revenue view
CREATE VIEW daily_revenue AS
SELECT 
    branch_id,
    DATE(created_at) as date,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value
FROM orders
WHERE status = 'completed' AND payment_status = 'paid'
GROUP BY branch_id, DATE(created_at);

-- Popular dishes view
CREATE VIEW popular_dishes AS
SELECT 
    d.id,
    d.name,
    d.price,
    COUNT(oi.id) as times_ordered,
    SUM(oi.quantity) as total_quantity,
    SUM(oi.subtotal) as total_revenue
FROM dishes d
JOIN order_items oi ON d.id = oi.dish_id
JOIN orders o ON oi.order_id = o.id
WHERE o.status = 'completed'
GROUP BY d.id
ORDER BY times_ordered DESC;

-- Customer loyalty view
CREATE VIEW customer_loyalty AS
SELECT 
    u.id,
    u.first_name || ' ' || u.last_name as customer_name,
    u.email,
    u.points,
    COUNT(o.id) as total_orders,
    SUM(o.total_amount) as total_spent,
    AVG(o.total_amount) as average_order_value,
    MAX(o.created_at) as last_order_date
FROM users u
LEFT JOIN orders o ON u.id = o.user_id AND o.status = 'completed'
GROUP BY u.id
ORDER BY total_spent DESC;
