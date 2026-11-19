-- ============================================================================
-- Wash n' Dash — Laundry Shop Management System
-- Initial Seed Data (seed.sql)
-- Note: Run `npm run db:init` inside backend/ to apply schema + bcrypt hashes.
-- ============================================================================

BEGIN;

-- 1. Staff & Admin Accounts (valid bcryptjs $2a$10$ hashes for admin123 / staff123)
INSERT INTO staff_users (id, full_name, email, password_hash, contact_number, role, status, shift, date_registered)
VALUES
  ('STF-001', 'Luieme Etcobanes', 'etcobanes@gmail.com', '$2a$10$WashNDashAdminSalt123ud4RGX/W3uj1WcPI/zyBb0GcOwe/w5vq', '+63 917 801 2345', 'ADMIN', 'Active', 'Full-Time · Branch Administrator', '2024-01-10'),
  ('STF-002', 'Ken Luigi Dela Torre', 'delatorre@gmail.com', '$2a$10$WashNDashAdminSalt123ud4RGX/W3uj1WcPI/zyBb0GcOwe/w5vq', '+63 917 802 6789', 'ADMIN', 'Active', 'Full-Time · Co-Administrator', '2024-01-10'),
  ('STF-003', 'Elena Reyes', 'elena.reyes@gmail.com', '$2a$10$WashNDashStaffSalt123u9bVI15oMVhU9AufD./ctMpBFGbaNZUu', '+63 917 442 8890', 'STAFF', 'Active', 'Morning Shift (7:00 AM – 3:00 PM)', '2024-03-14'),
  ('STF-004', 'Carlo Mendoza', 'carlo.mendoza@gmail.com', '$2a$10$WashNDashStaffSalt123u9bVI15oMVhU9AufD./ctMpBFGbaNZUu', '+63 918 553 1124', 'STAFF', 'Active', 'Morning Shift (7:00 AM – 3:00 PM)', '2024-05-02'),
  ('STF-005', 'Jessa Bautista', 'jessa.bautista@gmail.com', '$2a$10$WashNDashStaffSalt123u9bVI15oMVhU9AufD./ctMpBFGbaNZUu', '+63 919 712 4098', 'STAFF', 'Active', 'Afternoon Shift (1:00 PM – 9:00 PM)', '2024-07-19'),
  ('STF-006', 'Paolo Santos', 'paolo.santos@gmail.com', '$2a$10$WashNDashStaffSalt123u9bVI15oMVhU9AufD./ctMpBFGbaNZUu', '+63 920 331 9044', 'STAFF', 'Inactive', 'On Leave', '2024-09-05')
ON CONFLICT (id) DO NOTHING;

-- 2. Customers
INSERT INTO customers (id, full_name, contact_number, address, email, registration_date, status)
VALUES
  ('CUS-001', 'Camille Navarro', '+63 917 512 4820', 'Unit 14B, Paseo Parkview, Makati City', 'camille.navarro@email.ph', '2025-01-14', 'Active'),
  ('CUS-002', 'Rafael Soriano', '+63 918 394 7711', '42 Katipunan Ave, Loyola Heights, Quezon City', 'rafael.soriano@email.ph', '2025-02-03', 'Active'),
  ('CUS-003', 'Beatriz Lim', '+63 917 908 3312', '88 Shaw Blvd, Kapitolyo, Pasig City', 'beatriz.lim@email.ph', '2025-02-22', 'Active'),
  ('CUS-004', 'Gabriel Aquino', '+63 920 811 2456', '19 Taft Ave, Malate, Manila', 'gabriel.aquino@email.ph', '2025-03-11', 'Active'),
  ('CUS-005', 'Patricia Cruz', '+63 917 664 1903', '124 Aguirre Ave, BF Homes, Parañaque', 'patricia.cruz@email.ph', '2025-04-06', 'Active'),
  ('CUS-006', 'Lorenzo Dizon', '+63 919 245 8832', '7F High Street South, BGC, Taguig', 'lorenzo.dizon@email.ph', '2025-05-18', 'Active'),
  ('CUS-007', 'Samantha Ong', '+63 917 302 6571', '51 Banawe St, Santa Mesa Heights, Quezon City', 'sam.ong@email.ph', '2025-06-09', 'Active'),
  ('CUS-008', 'Miguel Torres', '+63 922 773 1029', '205 Pioneer St, Mandaluyong City', 'miguel.torres@email.ph', '2025-08-01', 'Inactive')
ON CONFLICT (id) DO NOTHING;

-- 3. Laundry Services & PHP Rates
INSERT INTO laundry_services (id, name, description, price_per_kg, estimated_time, available, icon_key, color_variant)
VALUES
  ('SRV-001', 'Wash, Dry & Fold', 'Complete everyday laundry care sorted by color, washed with gentle detergent, tumble-dried, and neatly folded.', 45.00, '24 hrs', TRUE, 'shirt', 'blue'),
  ('SRV-002', 'Wash & Dry', 'Quick-turnaround wash and tumble dry service ideal for everyday wear and towels.', 35.00, '12–18 hrs', TRUE, 'droplets', 'mint'),
  ('SRV-003', 'Dry Cleaning', 'Solvent-based garment care for barongs, suits, coats, silk dresses, and delicate formal attire.', 180.00, '48–72 hrs', TRUE, 'sparkles', 'violet'),
  ('SRV-004', 'Comforter Cleaning', 'Deep-sanitizing large-drum wash for comforters, duvets, bedsheets, and heavy curtains.', 160.00, '36–48 hrs', TRUE, 'layers', 'peach'),
  ('SRV-005', 'Ironing Services', 'Crisp steam-pressing and hanger finishing for office uniforms, polos, and trousers.', 40.00, '12 hrs', TRUE, 'wind', 'blue'),
  ('SRV-006', 'Express Same-Day Wash', 'Priority 6-hour wash, dry, and fold service for urgent laundry loads dropped off before noon.', 75.00, '6 hrs', FALSE, 'zap', 'violet')
ON CONFLICT (id) DO NOTHING;

-- 4. Orders (including multi-service order WD-1054)
INSERT INTO orders (
  id, customer_id, assigned_staff_id, service_summary, total_weight_kg,
  additional_charges, discount, total_amount, amount_paid, remaining_balance,
  payment_status, laundry_status, date_received, expected_completion_date,
  special_instructions, stage_timestamps
)
VALUES
  (
    'WD-1054', 'CUS-001', 'STF-003', 'Wash, Dry & Fold + Ironing Services', 8.50,
    35.00, 0.00, 417.50, 417.50, 0.00,
    'Paid', 'Washing', NOW() - INTERVAL '3.5 hours', NOW() + INTERVAL '20.5 hours',
    'Separate white polos; use hypoallergenic fabric conditioner.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '3.5 hours',
      'Pending', NOW() - INTERVAL '3 hours',
      'Washing', NOW() - INTERVAL '1.5 hours'
    )
  ),
  (
    'WD-1053', 'CUS-002', 'STF-004', 'Dry Cleaning', 2.50,
    100.00, 0.00, 550.00, 250.00, 300.00,
    'Partial Payment', 'Drying', NOW() - INTERVAL '28 hours', NOW() + INTERVAL '14 hours',
    'Two barong tagalog shirts on wooden hangers.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '28 hours',
      'Pending', NOW() - INTERVAL '24 hours',
      'Washing', NOW() - INTERVAL '18 hours',
      'Drying', NOW() - INTERVAL '10 hours'
    )
  ),
  (
    'WD-1052', 'CUS-003', 'STF-003', 'Comforter Cleaning', 4.20,
    0.00, 50.00, 622.00, 0.00, 622.00,
    'Unpaid', 'Washing', NOW() - INTERVAL '40 hours', NOW() - INTERVAL '3 hours',
    'King-size duvet cover; double rinse cycle.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '40 hours',
      'Pending', NOW() - INTERVAL '36 hours',
      'Washing', NOW() - INTERVAL '18 hours'
    )
  ),
  (
    'WD-1051', 'CUS-004', 'STF-005', 'Wash, Dry & Fold', 6.00,
    0.00, 0.00, 270.00, 270.00, 0.00,
    'Paid', 'Ready for Pickup', NOW() - INTERVAL '22 hours', NOW() + INTERVAL '4 hours',
    'Standard detergent and fold neatly.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '22 hours',
      'Pending', NOW() - INTERVAL '20 hours',
      'Washing', NOW() - INTERVAL '16 hours',
      'Drying', NOW() - INTERVAL '10 hours',
      'Folding', NOW() - INTERVAL '5 hours',
      'Ready for Pickup', NOW() - INTERVAL '2 hours'
    )
  ),
  (
    'WD-1049', 'CUS-006', 'STF-003', 'Wash & Dry', 10.00,
    0.00, 0.00, 350.00, 350.00, 0.00,
    'Paid', 'Completed', NOW() - INTERVAL '2 days', NOW() - INTERVAL '1 day',
    'Gym clothes and bath towels.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '2 days',
      'Pending', NOW() - INTERVAL '44 hours',
      'Washing', NOW() - INTERVAL '40 hours',
      'Drying', NOW() - INTERVAL '35 hours',
      'Folding', NOW() - INTERVAL '30 hours',
      'Ready for Pickup', NOW() - INTERVAL '26 hours',
      'Completed', NOW() - INTERVAL '1 hour'
    )
  ),
  (
    'WD-1048', 'CUS-007', 'STF-005', 'Comforter Cleaning', 2.50,
    0.00, 60.00, 340.00, 150.00, 190.00,
    'Partial Payment', 'Pending', NOW() - INTERVAL '30 hours', NOW() - INTERVAL '2 hours',
    'Queen fleece blanket.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '30 hours',
      'Pending', NOW() - INTERVAL '28 hours'
    )
  ),
  (
    'WD-1047', 'CUS-001', 'STF-003', 'Wash, Dry & Fold', 12.00,
    50.00, 0.00, 590.00, 590.00, 0.00,
    'Paid', 'Completed', NOW() - INTERVAL '3 days', NOW() - INTERVAL '2 days',
    'Weekly household load.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '3 days',
      'Completed', NOW() - INTERVAL '2 days'
    )
  ),
  (
    'WD-1043', 'CUS-002', 'STF-003', 'Wash, Dry & Fold', 10.00,
    0.00, 0.00, 450.00, 450.00, 0.00,
    'Paid', 'Order Received', NOW() - INTERVAL '30 minutes', NOW() + INTERVAL '23 hours',
    'Walk-in drop-off at front counter.',
    jsonb_build_object(
      'Order Received', NOW() - INTERVAL '30 minutes'
    )
  )
ON CONFLICT (id) DO NOTHING;

-- 5. Order Service Line Items (3NF Multi-Service Support)
INSERT INTO order_items (order_id, service_id, service_name, weight_kg, price_per_kg, subtotal)
VALUES
  ('WD-1054', 'SRV-001', 'Wash, Dry & Fold', 6.50, 45.00, 292.50),
  ('WD-1054', 'SRV-005', 'Ironing Services', 2.25, 40.00, 90.00),
  ('WD-1053', 'SRV-003', 'Dry Cleaning', 2.50, 180.00, 450.00),
  ('WD-1052', 'SRV-004', 'Comforter Cleaning', 4.20, 160.00, 672.00),
  ('WD-1051', 'SRV-001', 'Wash, Dry & Fold', 6.00, 45.00, 270.00),
  ('WD-1049', 'SRV-002', 'Wash & Dry', 10.00, 35.00, 350.00),
  ('WD-1048', 'SRV-004', 'Comforter Cleaning', 2.50, 160.00, 400.00),
  ('WD-1047', 'SRV-001', 'Wash, Dry & Fold', 12.00, 45.00, 540.00),
  ('WD-1043', 'SRV-001', 'Wash, Dry & Fold', 10.00, 45.00, 450.00)
ON CONFLICT (order_id, service_id) DO NOTHING;

-- 6. Tracking History
INSERT INTO order_tracking_history (id, order_id, previous_status, new_status, staff_id, staff_name, remarks, created_at)
VALUES
  ('TRK-001', 'WD-1054', 'Created', 'Order Received', 'STF-003', 'Elena Reyes', 'Weighed 6.5 kg Wash, Dry & Fold + 2.25 kg Ironing Services.', NOW() - INTERVAL '3.5 hours'),
  ('TRK-002', 'WD-1054', 'Order Received', 'Pending', 'STF-003', 'Elena Reyes', 'Queued for Drum #2.', NOW() - INTERVAL '3 hours'),
  ('TRK-003', 'WD-1054', 'Pending', 'Washing', 'STF-003', 'Elena Reyes', 'Gentle warm cycle started.', NOW() - INTERVAL '1.5 hours'),
  ('TRK-004', 'WD-1053', 'Created', 'Order Received', 'STF-004', 'Carlo Mendoza', 'Barong Tagalog dry cleaning received.', NOW() - INTERVAL '28 hours'),
  ('TRK-005', 'WD-1053', 'Order Received', 'Drying', 'STF-004', 'Carlo Mendoza', 'Finishing solvent cycle.', NOW() - INTERVAL '10 hours'),
  ('TRK-006', 'WD-1052', 'Created', 'Washing', 'STF-003', 'Elena Reyes', 'Comforter deep-wash cycle running.', NOW() - INTERVAL '18 hours'),
  ('TRK-007', 'WD-1051', 'Folding', 'Ready for Pickup', 'STF-005', 'Jessa Bautista', 'Placed on Pickup Shelf A-3.', NOW() - INTERVAL '2 hours'),
  ('TRK-008', 'WD-1049', 'Ready for Pickup', 'Completed', 'STF-003', 'Elena Reyes', 'Claimed by customer.', NOW() - INTERVAL '1 hour'),
  ('TRK-009', 'WD-1043', 'Created', 'Order Received', 'STF-003', 'Elena Reyes', 'Walk-in drop-off received.', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- 7. Payment Transactions (PHP)
INSERT INTO payment_transactions (
  id, order_id, customer_id, amount_paid, order_total, remaining_balance,
  payment_method, payment_status, processed_by_id, processed_by_name, reference_number, notes, payment_date
)
VALUES
  ('TXN-8907', 'WD-1054', 'CUS-001', 417.50, 417.50, 0.00, 'GCash', 'Paid', 'STF-003', 'Elena Reyes', 'GC-99284102', 'Paid in full at drop-off', NOW() - INTERVAL '3.4 hours'),
  ('TXN-8906', 'WD-1049', 'CUS-006', 350.00, 350.00, 0.00, 'Maya', 'Paid', 'STF-003', 'Elena Reyes', 'MY-55410291', NULL, NOW() - INTERVAL '1 hour'),
  ('TXN-8905', 'WD-1051', 'CUS-004', 270.00, 270.00, 0.00, 'Cash', 'Paid', 'STF-005', 'Jessa Bautista', NULL, NULL, NOW() - INTERVAL '2 hours'),
  ('TXN-8904', 'WD-1053', 'CUS-002', 250.00, 550.00, 300.00, 'GCash', 'Partial Payment', 'STF-001', 'Luieme Etcobanes', 'GC-99281140', 'Downpayment upon drop-off', NOW() - INTERVAL '28 hours'),
  ('TXN-8903', 'WD-1048', 'CUS-007', 150.00, 340.00, 190.00, 'Cash', 'Partial Payment', 'STF-005', 'Jessa Bautista', NULL, 'Partial cash deposit', NOW() - INTERVAL '30 hours'),
  ('TXN-8902', 'WD-1047', 'CUS-001', 590.00, 590.00, 0.00, 'GCash', 'Paid', 'STF-003', 'Elena Reyes', 'GC-99274811', NULL, NOW() - INTERVAL '2 days'),
  ('TXN-8899', 'WD-1043', 'CUS-002', 450.00, 450.00, 0.00, 'GCash', 'Paid', 'STF-003', 'Elena Reyes', 'GC-99289901', 'Paid at drop-off', NOW() - INTERVAL '30 minutes')
ON CONFLICT (id) DO NOTHING;

-- 8. Inventory Items
INSERT INTO inventory_items (id, name, category, quantity, min_threshold, unit, archived, last_updated)
VALUES
  ('INV-001', 'Liquid Laundry Detergent (Commercial)', 'Detergents', 42, 15, 'Liters', FALSE, NOW() - INTERVAL '5 hours'),
  ('INV-002', 'Hypoallergenic Fabric Conditioner', 'Fabric Care', 11, 12, 'Liters', FALSE, NOW() - INTERVAL '12 hours'),
  ('INV-003', 'Enzyme Stain Remover Spray', 'Stain Removal', 8, 10, 'Bottles', FALSE, NOW() - INTERVAL '1 day'),
  ('INV-004', 'Color-Safe Oxygen Bleach', 'Detergents', 28, 10, 'Kg', FALSE, NOW() - INTERVAL '2 days'),
  ('INV-005', 'Heavy-Duty Plastic Garment Bags', 'Packaging', 320, 100, 'Pieces', FALSE, NOW() - INTERVAL '18 hours'),
  ('INV-006', 'Dry Cleaning Wire Hangers', 'Supplies', 0, 50, 'Pieces', FALSE, NOW() - INTERVAL '1 day'),
  ('INV-007', 'Lavender Dryer Sheets', 'Fabric Care', 14, 15, 'Boxes', FALSE, NOW() - INTERVAL '1 day')
ON CONFLICT (id) DO NOTHING;

-- 9. Business Settings
INSERT INTO business_settings (
  id, business_name, contact_number, address, email, currency,
  receipt_header, receipt_footer, include_staff_on_receipt, include_payment_breakdown, auto_low_stock_alerts
)
VALUES (
  1,
  'Wash n'' Dash',
  '+63 2 8842 9100',
  '128 Jupiter Street, Bel-Air, Makati City, Metro Manila 1209',
  'hello@washndash.ph',
  'PHP',
  'Fresh, Fast & Reliable Laundry Care',
  'Thank you for choosing Wash n'' Dash! Please present this receipt upon pickup.',
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (id) DO NOTHING;

-- 10. Notifications
INSERT INTO notifications (id, title, description, type, target_role, is_read, created_at)
VALUES
  ('NTF-001', 'Delayed Order Alert: #WD-1052', 'Beatriz Lim’s Comforter Cleaning has passed its expected completion time.', 'delay', 'ALL', FALSE, NOW() - INTERVAL '15 minutes'),
  ('NTF-002', 'Out of Stock: Wire Hangers', 'Dry Cleaning Wire Hangers quantity reached 0 pcs.', 'inventory', 'ADMIN', FALSE, NOW() - INTERVAL '1 hour'),
  ('NTF-003', 'New Drop-Off: #WD-1043', 'Rafael Soriano (10.0 kg Wash, Dry & Fold) paid ₱450.00 via GCash.', 'order', 'ALL', FALSE, NOW() - INTERVAL '30 minutes'),
  ('NTF-004', 'Order Ready: #WD-1051', 'Gabriel Aquino’s order moved to Ready for Pickup on Shelf A-3.', 'payment', 'STAFF', TRUE, NOW() - INTERVAL '2 hours')
ON CONFLICT (id) DO NOTHING;

COMMIT;
