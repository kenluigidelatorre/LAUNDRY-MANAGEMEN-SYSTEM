-- ============================================================================
-- Wash n' Dash — Laundry Shop Management System
-- PostgreSQL Relational Database Schema (schema.sql)
-- ============================================================================

BEGIN;

-- 1. Staff & Admin Users
CREATE TABLE IF NOT EXISTS staff_users (
  id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  role VARCHAR(10) NOT NULL CHECK (role IN ('ADMIN', 'STAFF')),
  status VARCHAR(15) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  shift VARCHAR(120) NOT NULL DEFAULT 'Morning Shift (7:00 AM – 3:00 PM)',
  date_registered DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_staff_users_role ON staff_users(role);
CREATE INDEX IF NOT EXISTS idx_staff_users_status ON staff_users(status);

-- 2. Customers
CREATE TABLE IF NOT EXISTS customers (
  id VARCHAR(20) PRIMARY KEY,
  full_name VARCHAR(120) NOT NULL,
  contact_number VARCHAR(40) NOT NULL,
  address TEXT NOT NULL,
  email VARCHAR(160),
  status VARCHAR(15) NOT NULL DEFAULT 'Active' CHECK (status IN ('Active', 'Inactive')),
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(LOWER(full_name));
CREATE INDEX IF NOT EXISTS idx_customers_status ON customers(status);

-- 3. Laundry Services & Pricing (PHP)
CREATE TABLE IF NOT EXISTS laundry_services (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(120) NOT NULL UNIQUE,
  description TEXT NOT NULL,
  price_per_kg NUMERIC(10, 2) NOT NULL CHECK (price_per_kg > 0),
  estimated_time VARCHAR(60) NOT NULL,
  available BOOLEAN NOT NULL DEFAULT TRUE,
  icon_key VARCHAR(20) NOT NULL DEFAULT 'shirt' CHECK (icon_key IN ('shirt', 'droplets', 'sparkles', 'layers', 'wind', 'zap')),
  color_variant VARCHAR(20) NOT NULL DEFAULT 'blue' CHECK (color_variant IN ('blue', 'violet', 'mint', 'peach')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Orders
CREATE TABLE IF NOT EXISTS orders (
  id VARCHAR(20) PRIMARY KEY,
  customer_id VARCHAR(20) NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  assigned_staff_id VARCHAR(20) NOT NULL REFERENCES staff_users(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  service_summary TEXT NOT NULL,
  total_weight_kg NUMERIC(10, 2) NOT NULL CHECK (total_weight_kg > 0),
  additional_charges NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (additional_charges >= 0),
  discount NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (discount >= 0),
  total_amount NUMERIC(10, 2) NOT NULL CHECK (total_amount >= 0),
  amount_paid NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (amount_paid >= 0),
  remaining_balance NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (remaining_balance >= 0),
  payment_status VARCHAR(20) NOT NULL DEFAULT 'Unpaid' CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial Payment')),
  laundry_status VARCHAR(30) NOT NULL DEFAULT 'Order Received' CHECK (
    laundry_status IN (
      'Order Received',
      'Pending',
      'Washing',
      'Drying',
      'Folding',
      'Ready for Pickup',
      'Completed',
      'Cancelled'
    )
  ),
  date_received TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expected_completion_date TIMESTAMPTZ NOT NULL,
  special_instructions TEXT NOT NULL DEFAULT '',
  stage_timestamps JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_customer ON orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_staff ON orders(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_orders_laundry_status ON orders(laundry_status);
CREATE INDEX IF NOT EXISTS idx_orders_payment_status ON orders(payment_status);
CREATE INDEX IF NOT EXISTS idx_orders_date_received ON orders(date_received DESC);

-- 5. Order Service Line Items (Supports Multiple Services per Order)
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  service_id VARCHAR(20) NOT NULL REFERENCES laundry_services(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  service_name VARCHAR(120) NOT NULL,
  weight_kg NUMERIC(10, 2) NOT NULL CHECK (weight_kg > 0),
  price_per_kg NUMERIC(10, 2) NOT NULL CHECK (price_per_kg > 0),
  subtotal NUMERIC(10, 2) NOT NULL CHECK (subtotal >= 0),
  UNIQUE (order_id, service_id)
);

CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_service ON order_items(service_id);

-- 6. Order Tracking History (Chronological Audit Log)
CREATE TABLE IF NOT EXISTS order_tracking_history (
  id VARCHAR(40) PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  previous_status VARCHAR(30) NOT NULL,
  new_status VARCHAR(30) NOT NULL,
  staff_id VARCHAR(20) REFERENCES staff_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  staff_name VARCHAR(120) NOT NULL,
  remarks TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tracking_order ON order_tracking_history(order_id, created_at ASC);

-- 7. Payment Transactions (Cash, GCash, Maya in PHP)
CREATE TABLE IF NOT EXISTS payment_transactions (
  id VARCHAR(20) PRIMARY KEY,
  order_id VARCHAR(20) NOT NULL REFERENCES orders(id) ON UPDATE CASCADE ON DELETE CASCADE,
  customer_id VARCHAR(20) NOT NULL REFERENCES customers(id) ON UPDATE CASCADE ON DELETE RESTRICT,
  amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
  order_total NUMERIC(10, 2) NOT NULL CHECK (order_total >= 0),
  remaining_balance NUMERIC(10, 2) NOT NULL CHECK (remaining_balance >= 0),
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('Cash', 'GCash', 'Maya')),
  payment_status VARCHAR(20) NOT NULL CHECK (payment_status IN ('Paid', 'Unpaid', 'Partial Payment')),
  processed_by_id VARCHAR(20) REFERENCES staff_users(id) ON UPDATE CASCADE ON DELETE SET NULL,
  processed_by_name VARCHAR(120) NOT NULL,
  reference_number VARCHAR(80),
  notes TEXT,
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_order ON payment_transactions(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payment_transactions(payment_date DESC);

-- 8. Supplies & Inventory
CREATE TABLE IF NOT EXISTS inventory_items (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(140) NOT NULL,
  category VARCHAR(40) NOT NULL CHECK (category IN ('Detergents', 'Fabric Care', 'Stain Removal', 'Packaging', 'Supplies')),
  quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  min_threshold INTEGER NOT NULL DEFAULT 10 CHECK (min_threshold >= 1),
  unit VARCHAR(40) NOT NULL,
  archived BOOLEAN NOT NULL DEFAULT FALSE,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_archived ON inventory_items(archived);

-- 9. Business Settings (Single Configuration Row)
CREATE TABLE IF NOT EXISTS business_settings (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  business_name VARCHAR(120) NOT NULL DEFAULT 'Wash n'' Dash',
  contact_number VARCHAR(40) NOT NULL,
  address TEXT NOT NULL,
  email VARCHAR(160) NOT NULL,
  currency VARCHAR(10) NOT NULL DEFAULT 'PHP' CHECK (currency = 'PHP'),
  receipt_header VARCHAR(200) NOT NULL,
  receipt_footer TEXT NOT NULL,
  include_staff_on_receipt BOOLEAN NOT NULL DEFAULT TRUE,
  include_payment_breakdown BOOLEAN NOT NULL DEFAULT TRUE,
  auto_low_stock_alerts BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. System Notifications
CREATE TABLE IF NOT EXISTS notifications (
  id VARCHAR(30) PRIMARY KEY,
  title VARCHAR(160) NOT NULL,
  description TEXT NOT NULL,
  type VARCHAR(20) NOT NULL CHECK (type IN ('order', 'payment', 'delay', 'inventory')),
  target_role VARCHAR(10) NOT NULL DEFAULT 'ALL' CHECK (target_role IN ('ALL', 'ADMIN', 'STAFF')),
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMIT;
