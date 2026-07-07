USE stock_mgt;
-- =========================================================================
-- 1. SEED USERS
-- =========================================================================
INSERT INTO users (name, email, password) VALUES
('Admin User', 'admin@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O'),
('Wai Linn Naing', 'wailinnaing@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O'),
('Kyaw Zaw', 'kyawzaw@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O'),
('Hein Aung San', 'heinaungsan@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O'),
('Banyar Tun', 'banyartun@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O'),
('Ei Chaw Phyu', 'eichawphyu@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O'),
('Hsu Hsu San', 'sususan@example.com', '$2b$10$hCBUpv3KEi.HFsLhoXqtiOimFqpf.3XMCz96s8ZaHJcb/mpJokT9O');
-- =========================================================================
-- 2. SEED CATEGORIES
-- =========================================================================
-- category parent
INSERT INTO category (id, name) VALUES
(1, 'IT Hardware'),
(5, 'Peripherals'),
(8, 'Pantry Supplies');
INSERT INTO category (id, name, minimum_threshold, remark, parent_id) VALUES
 
(2, 'Developer Laptops', 3, 'High-end specs for devs (16GB/32GB RAM)', 1),
(3, 'Test Devices', 2, 'Mobile phones & tablets for QA testing', 1),
(4, 'Monitors', 5, '4K & Ultrawide external displays', 1),
 
(6, 'Mechanical Keyboards & Mice', 5, 'Ergonomic input options', 5),
(7, 'Cables & Adapters', 15, 'HDMI, USB-C hubs, LAN cables', 5),
 
(9, 'Coffee Beans & Pods', 10, 'Fuel for developers (kg/packs)', 8),
(10, 'Snacks & Energy Drinks', 30, 'Weekly restocked snacks', 8);
-- =========================================================================
-- 3. SEED MONTHS
-- =========================================================================
INSERT INTO month (id, month, year) VALUES
(1, 1, 2025),  (2, 2, 2025),  (3, 3, 2025),  (4, 4, 2025),
(5, 5, 2025),  (6, 6, 2025),  (7, 7, 2025),  (8, 8, 2025),
(9, 9, 2025),  (10, 10, 2025),(11, 11, 2025),(12, 12, 2025),
(13, 1, 2026), (14, 2, 2026), (15, 3, 2026), (16, 4, 2026),
(17, 5, 2026), (18, 6, 2026), (19, 7, 2026);
-- =========================================================================
-- 4. SEED MONTHLY STOCK DATA
-- =========================================================================
INSERT INTO monthly_stock_data (id, month_id, category_id, opening_qty, closing_qty, created_by) VALUES
-- Jan 2026 (month_id=13)
(1, 13, 2, 10, 31, 1),  -- Laptops: Open 10 + Bought 24 - Used 3 = 31
(2, 13, 3, 5,  34, 1),  -- Test Devices: Open 5 + Bought 30 - Used 1 = 34
(3, 13, 4, 15, 40, 1),  -- Monitors: Open 15 + Bought 30 - Used 5 = 40
(4, 13, 6, 8,  41, 1),  -- Keyboards: Open 8 + Bought 35 - Used 2 = 41
(5, 13, 7, 30, 76, 1),  -- Cables: Open 30 + Bought 50 - Used 4 = 76
(6, 13, 9, 20, 88, 1),  -- Coffee: Open 20 + Bought 80 - Used 12 = 88
-- Feb 2026 (month_id=14)
(7, 14, 2, 31, 43, 1),  -- Laptops: Open 31 + Bought 15 - Used 3 = 43
(8, 14, 3, 34, 33, 1),  -- Test Devices: Open 34 + Bought 0 - Used 1 = 33
(9, 14, 4, 40, 36, 1),  -- Monitors: Open 40 + Bought 0 - Used 4 = 36
(10,14, 6, 41, 39, 1),  -- Keyboards: Open 41 + Bought 0 - Used 2 = 39
(11,14, 7, 76, 112, 1), -- Cables: Open 76 + Bought 40 - Used 4 = 112
(12,14, 9, 88, 116, 1), -- Coffee: Open 88 + Bought 40 - Used 12 = 116
-- Mar 2026 (month_id=15)
(13,15, 2, 43, 57, 1),  -- Laptops: Open 43 + Bought 15 - Used 1 = 57
(14,15, 3, 33, 52, 1),  -- Test Devices: Open 33 + Bought 20 - Used 1 = 52
(15,15, 4, 36, 49, 1),  -- Monitors: Open 36 + Bought 15 - Used 2 = 49
(16,15, 6, 39, 37, 1),  -- Keyboards: Open 39 + Bought 0 - Used 2 = 37
(17,15, 7, 112, 108, 1),-- Cables: Open 112 + Bought 0 - Used 4 = 108
(18,15, 9, 116, 144, 1),-- Coffee: Open 116 + Bought 40 - Used 12 = 144
-- Apr 2026 (month_id=16)
(19,16, 2, 57, 55, 1),  -- Laptops: Open 57 + Bought 0 - Used 2 = 55
(20,16, 3, 52, 51, 1),  -- Test Devices: Open 52 + Bought 0 - Used 1 = 51
(21,16, 4, 49, 67, 1),  -- Monitors: Open 49 + Bought 20 - Used 2 = 67
(22,16, 6, 37, 56, 1),  -- Keyboards: Open 37 + Bought 20 - Used 1 = 56
(23,16, 7, 108, 134, 1),-- Cables: Open 108 + Bought 30 - Used 4 = 134
(24,16, 9, 144, 172, 1),-- Coffee: Open 144 + Bought 40 - Used 12 = 172
-- May 2026 (month_id=17)
(25,17, 2, 55, 53, 1),  -- Laptops: Open 55 + Bought 0 - Used 2 = 53
(26,17, 3, 51, 65, 1),  -- Test Devices: Open 51 + Bought 15 - Used 1 = 65
(27,17, 4, 67, 65, 1),  -- Monitors: Open 67 + Bought 0 - Used 2 = 65
(28,17, 6, 55, 53, 1),  -- Keyboards: Open 55 + Bought 0 - Used 2 = 53
(29,17, 7, 134, 130, 1),-- Cables: Open 134 + Bought 0 - Used 4 = 130
(30,17, 9, 172, 200, 1),-- Coffee: Open 172 + Bought 40 - Used 12 = 200
-- June 2026 (month_id=18)
(31,18, 2, 53, 52, 1),  -- Laptops: Open 53 + Bought 0 - Used 1 = 52
(32,18, 3, 65, 64, 1),  -- Test Devices: Open 65 + Bought 0 - Used 1 = 64
(33,18, 4, 65, 78, 1),  -- Monitors: Open 65 + Bought 15 - Used 2 = 78
(34,18, 6, 53, 52, 1),  -- Keyboards: Open 53 + Bought 0 - Used 1 = 52
(35,18, 7, 130, 156, 1),-- Cables: Open 130 + Bought 30 - Used 4 = 156
(36,18, 9, 200, 228, 1),-- Coffee: Open 200 + Bought 40 - Used 12 = 228
-- July 2026 (month_id=19)
(37,19, 2, 0,  0,  1),  -- Laptops: Delete Target
(38,19, 4, 0,  0,  1),  -- Monitors: Delete Target
(39,19, 3, 64, 78, 1),  -- Test Devices: Open 64 + Bought 15 - Used 1 = 78
(40,19, 6, 52, 65, 1),  -- Keyboards: Open 52 + Bought 15 - Used 2 = 65
(41,19, 7, 156, 182, 1),-- Cables: Open 156 + Bought 30 - Used 4 = 182
(42,19, 9, 228, 226, 1);-- Coffee: Open 228 + Bought 0 - Used 2 = 226

-- =========================================================================
-- 5. SEED WEEKLY STOCK CHECKS
-- =========================================================================
INSERT INTO weekly_stock_check (month_id, category_id, used_qty_1st_week, used_qty_2nd_week, used_qty_3rd_week, used_qty_4th_week, used_qty_5th_week, checked_week_1, checked_week_2, checked_week_3, checked_week_4, checked_week_5, created_by) VALUES
-- Jan 2026
(13, 2, 1, 1, 0, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(13, 3, 0, 1, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(13, 4, 2, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(13, 6, 0, 1, 0, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(13, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(13, 9, 3, 3, 3, 3, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
-- Feb 2026
(14, 2, 1, 0, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(14, 3, 1, 0, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(14, 4, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(14, 6, 1, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(14, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(14, 9, 3, 3, 3, 3, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
-- Mar 2026
(15, 2, 0, 1, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(15, 3, 0, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(15, 4, 1, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(15, 6, 1, 0, 0, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(15, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(15, 9, 3, 3, 3, 3, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
-- Apr 2026
(16, 2, 1, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(16, 3, 1, 0, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(16, 4, 0, 1, 0, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(16, 6, 0, 1, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(16, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(16, 9, 3, 3, 3, 3, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
-- May 2026
(17, 2, 1, 1, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(17, 3, 0, 0, 0, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(17, 4, 1, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(17, 6, 1, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(17, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(17, 9, 3, 3, 3, 3, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
-- June 2026
(18, 2, 0, 1, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(18, 3, 1, 0, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(18, 4, 1, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(18, 6, 0, 0, 1, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(18, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(18, 9, 3, 3, 3, 3, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
-- July 2026
(19, 2, 0, 0, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(19, 4, 0, 0, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(19, 3, 0, 1, 0, 0, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(19, 6, 1, 1, 0, 0, 0, TRUE, TRUE, FALSE, FALSE, FALSE, 1),
(19, 7, 1, 1, 1, 1, 0, TRUE, TRUE, TRUE, TRUE, FALSE, 1),
(19, 9, 1, 1, 0, 0, 0, TRUE, TRUE, FALSE, FALSE, FALSE, 1);

-- =========================================================================
-- 6. SEED PURCHASES (With up to 3 purchases per active category, zero lines removed)
-- =========================================================================
INSERT INTO purchases (monthly_stock_id, category_id, purchase_date, quantity, purchase_price, discount_price, quantity_per_unit, unit_price, discount_amount, created_by) VALUES
-- Jan 2026 Purchases (High volume, up to 3 separate purchase dates per item)
(1, 2, '2026-01-05', 8, 12000.00, 11500.00, 1, 1500.00, 500.00, 1),
(1, 2, '2026-01-15', 10, 15000.00, 15000.00, 1, 1500.00, 0.00, 1),
(1, 2, '2026-01-25', 6, 9300.00, 9000.00, 1, 1550.00, 300.00, 1),
(2, 3, '2026-01-04', 10, 5000.00, 5000.00, 1, 500.00, 0.00, 1),
(2, 3, '2026-01-12', 12, 6000.00, 5800.00, 1, 500.00, 200.00, 1),
(2, 3, '2026-01-22', 8, 4400.00, 4400.00, 1, 550.00, 0.00, 1),
(3, 4, '2026-01-06', 10, 4500.00, 4500.00, 1, 450.00, 0.00, 1),
(3, 4, '2026-01-18', 15, 6750.00, 6500.00, 1, 450.00, 250.00, 1),
(3, 4, '2026-01-28', 5, 2400.00, 2400.00, 1, 480.00, 0.00, 1),
(4, 6, '2026-01-02', 15, 3000.00, 3000.00, 1, 200.00, 0.00, 1),
(4, 6, '2026-01-14', 10, 2000.00, 1900.00, 1, 200.00, 100.00, 1),
(4, 6, '2026-01-26', 10, 2200.00, 2200.00, 1, 220.00, 0.00, 1),
(5, 7, '2026-01-08', 20, 500.00, 500.00, 1, 25.00, 0.00, 1),
(5, 7, '2026-01-18', 20, 500.00, 480.00, 1, 25.00, 20.00, 1),
(5, 7, '2026-01-29', 10, 280.00, 280.00, 1, 28.00, 0.00, 1),
(6, 9, '2026-01-05', 30, 1200.00, 1200.00, 1, 40.00, 0.00, 1),
(6, 9, '2026-01-15', 30, 1200.00, 1150.00, 1, 40.00, 50.00, 1),
(6, 9, '2026-01-25', 20, 900.00, 900.00, 1, 45.00, 0.00, 1),
-- Feb 2026 Purchases
(7, 2, '2026-02-05', 5, 7750.00, 7750.00, 1, 1550.00, 0.00, 1),
(7, 2, '2026-02-15', 5, 7750.00, 7500.00, 1, 1550.00, 250.00, 1),
(7, 2, '2026-02-24', 5, 8000.00, 8000.00, 1, 1600.00, 0.00, 1),
(11,7, '2026-02-10', 20, 560.00, 560.00, 1, 28.00, 0.00, 1),
(11,7, '2026-02-22', 20, 560.00, 560.00, 1, 28.00, 0.00, 1),
(12,9, '2026-02-08', 20, 900.00, 900.00, 1, 45.00, 0.00, 1),
(12,9, '2026-02-20', 20, 900.00, 900.00, 1, 45.00, 0.00, 1),
-- Mar 2026 Purchases
(13,2, '2026-03-05', 5, 8000.00, 8000.00, 1, 1600.00, 0.00, 1),
(13,2, '2026-03-18', 10, 1600.00, 15500.00, 1, 1600.00, 500.00, 1),
(14,3, '2026-03-10', 10, 5500.00, 5500.00, 1, 550.00, 0.00, 1),
(14,3, '2026-03-25', 10, 5500.00, 5500.00, 1, 550.00, 0.00, 1),
(15,4, '2026-03-12', 5, 2400.00, 2400.00, 1, 480.00, 0.00, 1),
(15,4, '2026-03-22', 10, 4800.00, 4800.00, 1, 480.00, 0.00, 1),
(18,9, '2026-03-11', 20, 900.00, 900.00, 1, 45.00, 0.00, 1),
(18,9, '2026-03-24', 20, 920.00, 920.00, 1, 46.00, 0.00, 1),
-- Apr 2026 Purchases
(21,4, '2026-04-05', 10, 4800.00, 4800.00, 1, 480.00, 0.00, 1),
(21,4, '2026-04-20', 10, 5000.00, 4800.00, 1, 500.00, 200.00, 1),
(22,6, '2026-04-12', 10, 2200.00, 2200.00, 1, 220.00, 0.00, 1),
(22,6, '2026-04-25', 10, 2200.00, 2200.00, 1, 220.00, 0.00, 1),
(23,7, '2026-04-08', 15, 420.00, 420.00, 1, 28.00, 0.00, 1),
(23,7, '2026-04-22', 15, 450.00, 450.00, 1, 30.00, 0.00, 1),
(24,9, '2026-04-10', 20, 920.00, 920.00, 1, 46.00, 0.00, 1),
(24,9, '2026-04-24', 20, 920.00, 920.00, 1, 46.00, 0.00, 1),
-- May 2026 Purchases
(26,3, '2026-05-05', 5, 2750.00, 2750.00, 1, 550.00, 0.00, 1),
(26,3, '2026-05-20', 10, 5600.00, 5600.00, 1, 560.00, 0.00, 1),
(30,9, '2026-05-12', 20, 920.00, 920.00, 1, 46.00, 0.00, 1),
(30,9, '2026-05-26', 20, 960.00, 960.00, 1, 48.00, 0.00, 1),
-- June 2026 Purchases
(33,4, '2026-06-10', 5, 2400.00, 2400.00, 1, 480.00, 0.00, 1),
(33,4, '2026-06-22', 10, 4900.00, 4900.00, 1, 490.00, 0.00, 1),
(35,7, '2026-06-05', 15, 450.00, 450.00, 1, 30.00, 0.00, 1),
(35,7, '2026-06-18', 15, 450.00, 450.00, 1, 30.00, 0.00, 1),
(36,9, '2026-06-12', 20, 960.00, 960.00, 1, 48.00, 0.00, 1),
(36,9, '2026-06-28', 20, 960.00, 960.00, 1, 48.00, 0.00, 1),
-- July 2026 Purchases 
(37,2, '2026-07-02', 0, 0.00,    0.00,    1, 0.00,    0.00,   1),
(38,4, '2026-07-04', 0, 0.00,    0.00,    1, 0.00,    0.00,   1),
(39, 3, '2026-07-02', 5, 2800.00, 2800.00, 1, 560.00, 0.00, 1),
(39, 3, '2026-07-12', 5, 2800.00, 2800.00, 1, 560.00, 0.00, 1),
(39, 3, '2026-07-22', 5, 2900.00, 2900.00, 1, 580.00, 0.00, 1),
(40, 6, '2026-07-05', 5, 1150.00, 1150.00, 1, 230.00, 0.00, 1),
(40, 6, '2026-07-15', 5, 1150.00, 1100.00, 1, 230.00, 50.00, 1),
(40, 6, '2026-07-25', 5, 1200.00, 1200.00, 1, 240.00, 0.00, 1),
(41, 7, '2026-07-04', 10, 300.00, 300.00, 1, 30.00, 0.00, 1),
(41, 7, '2026-07-14', 10, 300.00, 300.00, 1, 30.00, 0.00, 1),
(41, 7, '2026-07-24', 10, 320.00, 320.00, 1, 32.00, 0.00, 1);