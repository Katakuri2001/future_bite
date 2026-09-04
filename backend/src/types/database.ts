// Core Types for Enterprise Restaurant Ecosystem
export interface Env {
  // Database
  DB: D1Database;
  
  // Storage
  CACHE: KVNamespace;
  MEDIA: R2Bucket;
  
  // Real-time
  ORDER_MANAGER: DurableObjectNamespace;
  
  // Environment
  ENVIRONMENT: 'development' | 'staging' | 'production';
  
  // Security
  JWT_SECRET: string;
  JWT_REFRESH_SECRET: string;
  ENCRYPTION_KEY: string;
  
  // External APIs
  GOOGLE_MAPS_API_KEY?: string;
  STRIPE_SECRET_KEY?: string;
}

// Base entity interface
export interface BaseEntity {
  id: string;
  created_at: string;
  updated_at: string;
}

// User types
export interface User extends BaseEntity {
  branch_id: string;
  email: string;
  phone?: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  qr_code: string;
  barcode: string;
  points: number;
  is_verified: boolean;
  is_suspended: boolean;
  last_login_at?: string;
}

export interface Admin extends BaseEntity {
  branch_id: string;
  email: string;
  password_hash: string;
  first_name: string;
  last_name: string;
  role: 'super_admin' | 'admin' | 'staff';
  permissions?: Record<string, boolean>;
  is_active: boolean;
  last_login_at?: string;
}

// Order types
export interface Order extends BaseEntity {
  branch_id: string;
  user_id?: string;
  table_id?: string;
  order_number: string;
  status: 'pending' | 'accepted' | 'cooking' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  tax_amount: number;
  discount_amount: number;
  total_amount: number;
  payment_status: 'pending' | 'paid' | 'refunded' | 'failed';
  payment_method?: string;
  special_instructions?: string;
  idempotency_key?: string;
}

export interface OrderItem extends BaseEntity {
  order_id: string;
  dish_id: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
  special_instructions?: string;
  status: 'pending' | 'preparing' | 'ready' | 'served' | 'cancelled';
}

// Menu types
export interface Dish extends BaseEntity {
  branch_id: string;
  category_id: string;
  name: string;
  description?: string;
  price: number;
  cost_price?: number;
  points_value: number;
  preparation_time: number;
  image_url?: string;
  allergens?: string[];
  nutritional_info?: Record<string, any>;
  is_available: boolean;
  is_featured: boolean;
  display_order: number;
}

export interface Category extends BaseEntity {
  branch_id: string;
  name: string;
  description?: string;
  display_order: number;
  is_active: boolean;
}

export interface Table extends BaseEntity {
  branch_id: string;
  table_number: string;
  capacity: number;
  qr_code: string;
  location?: string;
  is_active: boolean;
}

// Booking types
export interface Booking extends BaseEntity {
  branch_id: string;
  user_id: string;
  table_id?: string;
  party_size: number;
  booking_date: string;
  booking_time: string;
  duration_minutes: number;
  status: 'pending' | 'approved' | 'cancelled' | 'expired' | 'completed' | 'no_show';
  special_requests?: string;
  contact_phone?: string;
  contact_email?: string;
  reminder_sent: boolean;
}

// Loyalty types
export interface LoyaltyTransaction extends BaseEntity {
  branch_id: string;
  user_id: string;
  order_id?: string;
  transaction_type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  balance_after: number;
  reference?: string;
  description?: string;
}

// Inventory types
export interface Supply extends BaseEntity {
  branch_id: string;
  supplier_id?: string;
  name: string;
  sku?: string;
  category?: string;
  unit: string;
  current_stock: number;
  min_stock_level: number;
  max_stock_level?: number;
  unit_cost?: number;
  last_restocked_at?: string;
  is_active: boolean;
}

export interface Supplier extends BaseEntity {
  branch_id: string;
  name: string;
  contact_person?: string;
  phone?: string;
  email?: string;
  address?: string;
  payment_terms?: string;
  is_active: boolean;
}

export interface SupplyTransaction extends BaseEntity {
  branch_id: string;
  supply_id: string;
  transaction_type: 'purchase' | 'usage' | 'adjustment' | 'waste';
  quantity: number;
  unit_cost?: number;
  total_cost?: number;
  reference?: string;
  notes?: string;
}

// Analytics types
export interface DailySales extends BaseEntity {
  branch_id: string;
  date: string;
  total_orders: number;
  total_revenue: number;
  total_customers: number;
  total_discounts: number;
  total_tax: number;
  average_order_value: number;
  peak_hour?: number;
}

export interface DishAnalytics extends BaseEntity {
  branch_id: string;
  dish_id: string;
  date: string;
  times_ordered: number;
  total_revenue: number;
  total_cost: number;
  profit_margin: number;
}

// Ratings
export interface Rating extends BaseEntity {
  branch_id: string;
  user_id: string;
  order_id?: string;
  rating: number;
  comment?: string;
  is_public: boolean;
}

// System types
export interface AuditLog extends BaseEntity {
  branch_id: string;
  user_id?: string;
  admin_id?: string;
  action: string;
  resource_type: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
}

export interface SystemConfig extends BaseEntity {
  branch_id: string;
  key: string;
  value: string;
  description?: string;
  is_public: boolean;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
    timestamp: string;
  };
}

// JWT Payload types
export interface JWTPayload {
  sub: string;
  type: 'access' | 'refresh';
  role: string;
  branch_id: string;
  permissions?: string[];
  iat: number;
  exp: number;
}

// Real-time event types
export interface RealtimeEvent {
  type: string;
  data: any;
  timestamp: string;
  branch_id: string;
  target?: string; // Specific user/table or 'all'
}

// QR Code types
export interface QRCodeData {
  type: 'table' | 'user' | 'menu';
  id: string;
  branch_id: string;
  timestamp: string;
  signature: string;
}

// Search and filter types
export interface SearchParams {
  query?: string;
  page?: number;
  limit?: number;
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
  filters?: Record<string, any>;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}
