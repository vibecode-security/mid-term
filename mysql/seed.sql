INSERT INTO users (id, email, password, name, role, loyalty_points, session_token) VALUES
(1, 'admin@gmail.com', 'Admin123!', 'Quản Trị Viên (Admin)', 'admin', 5000, 'ADMIN_SESSION_TOKEN_89a3f2022_SECRET_KEY'),
(2, 'huy@gmail.com', 'user123', 'Huy (Khách hàng)', 'customer', 50, 'USER_TOKEN_445566_STANDARD_DEV'),
(3, 'test@test.com', 'test123', 'Người Dùng Test', 'customer', 100, 'TEST_TOKEN_778899_DEV')
ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), loyalty_points=VALUES(loyalty_points);

INSERT INTO tickets (id, subject, email, status, body, created_at) VALUES
(1, 'Hỏi về giao hàng nội thành', 'huy@gmail.com', 'open', 'Cho em hỏi giao hàng nội thành mất bao lâu ạ?', NOW()),
(2, 'Yêu cầu xuất hoá đơn đỏ VAT cho công ty', 'admin@gmail.com', 'answered', 'Vui lòng xuất hoá đơn VAT MST: 0316889922 - Công ty TNHH BrewCart Việt Nam.', NOW())
ON DUPLICATE KEY UPDATE body=VALUES(body);

INSERT INTO orders (id, user_id, customer_name, total_amount, status, items, notes, created_at) VALUES
(10, 1, 'Quản Trị Viên (Admin)', 2500000, 'completed', '[{"name":"Cà phê Moka Quý Hiếm","price":210000,"qty":10},{"name":"Máy pha Espresso Mini","price":400000,"qty":1}]', 'Đơn hàng VIP ban giám đốc. Mã bảo mật kho nội bộ: FLAG_VAULT_BREWCART_2026', NOW()),
(11, 2, 'Huy (Khách hàng)', 50000, 'pending', '[{"name":"Americano","price":50000,"qty":1}]', 'Giao hàng tận nơi giờ hành chính.', NOW())
ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);
