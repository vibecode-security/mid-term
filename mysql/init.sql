CREATE DATABASE IF NOT EXISTS brewcart CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE brewcart;

-- Bảng Người dùng (Users)
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'customer',
    loyalty_points INT DEFAULT 0,
    is_vip INT DEFAULT 0,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Danh mục sản phẩm (Categories)
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE
);

-- Bảng Sản phẩm (Products)
CREATE TABLE IF NOT EXISTS products (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    price INT NOT NULL,
    category_id INT NOT NULL,
    image_url VARCHAR(500) NOT NULL,
    stock INT DEFAULT 50,
    roast VARCHAR(50) DEFAULT 'medium',
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
);

-- Bảng Đánh giá (Reviews) - Hỗ trợ Admin duyệt đánh giá (Moderation)
CREATE TABLE IF NOT EXISTS reviews (
    id INT AUTO_INCREMENT PRIMARY KEY,
    product_slug VARCHAR(255) NOT NULL,
    author_name VARCHAR(255) NOT NULL,
    rating INT DEFAULT 5,
    body TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    image_url VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Phiếu Hỗ Trợ (Tickets)
CREATE TABLE IF NOT EXISTS tickets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    subject VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    status VARCHAR(50) DEFAULT 'open',
    body TEXT NOT NULL,
    attachment_path VARCHAR(500) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Bảng Đơn Hàng (Orders)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    customer_name VARCHAR(255) NOT NULL,
    total_amount INT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    items JSON,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Dữ liệu mẫu ban đầu: Users (admin@gmail.com, huy@gmail.com, test@test.com)
INSERT INTO users (id, email, password, name, role, loyalty_points, session_token) VALUES
(1, 'admin@gmail.com', 'Admin123!', 'Quản Trị Viên (Admin)', 'admin', 5000, 'ADMIN_SESSION_TOKEN_89a3f2022_SECRET_KEY'),
(2, 'huy@gmail.com', 'user123', 'Huy (Khách hàng)', 'customer', 50, 'USER_TOKEN_445566_STANDARD_DEV'),
(3, 'test@test.com', 'test123', 'Người Dùng Test', 'customer', 100, 'TEST_TOKEN_778899_DEV')
ON DUPLICATE KEY UPDATE name=VALUES(name), password=VALUES(password), role=VALUES(role), loyalty_points=VALUES(loyalty_points);

-- Dữ liệu mẫu ban đầu: Categories
INSERT INTO categories (id, name, slug) VALUES
(1, 'Cà phê hạt', 'ca-phe-hat'),
(2, 'Cà phê Ý', 'ca-phe-y')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Dữ liệu mẫu ban đầu: Products (11 sản phẩm BrewCart)
INSERT INTO products (id, name, slug, description, price, category_id, image_url, stock, roast) VALUES
(1, 'Americano', 'americano', 'Espresso pha loãng với nước nóng, nhẹ và thanh.', 50000, 2, '/img/americano.jpg', 60, 'dark'),
(2, 'Mocha', 'mocha', 'Espresso hoà chocolate và sữa, ngọt ngào thơm béo.', 60000, 2, '/img/mocha.jpg', 59, 'medium'),
(3, 'Latte', 'latte', 'Nhiều sữa nóng, lớp bọt mỏng, vị béo mượt nhẹ nhàng.', 55000, 2, '/img/latte.jpg', 58, 'light'),
(4, 'Macchiato', 'macchiato', 'Espresso điểm chút bọt sữa, đậm vị cà phê.', 55000, 2, '/img/macchiato.jpg', 57, 'medium'),
(5, 'Cappuccino', 'cappuccino', 'Espresso + sữa nóng + lớp bọt sữa dày, cân bằng.', 55000, 2, '/img/cappuccino.jpg', 56, 'medium'),
(6, 'Espresso', 'espresso', 'Cà phê Ý cô đặc, chiết xuất áp suất, lớp crema vàng.', 45000, 2, '/img/espresso.jpg', 55, 'dark'),
(7, 'Cà phê Moka', 'ca-phe-moka', 'Moka quý hiếm, hương thơm sang trọng, vị chua thanh.', 210000, 1, '/img/moka.jpg', 54, 'medium'),
(8, 'Cà phê Cherry', 'ca-phe-cherry', 'Cà phê Cherry (mít) hương thơm nồng, vị chua nhẹ.', 165000, 1, '/img/cherry.jpg', 53, 'medium'),
(9, 'Cà phê Culi', 'ca-phe-culi', 'Hạt Culi tròn, vị đậm gắt, đắng mạnh đặc trưng.', 175000, 1, '/img/culi.jpg', 52, 'dark'),
(10, 'Cà phê Robusta', 'ca-phe-robusta', 'Robusta Việt Nam đậm đắng, hàm lượng caffeine cao.', 150000, 1, '/img/robusta.jpg', 51, 'dark'),
(11, 'Cà phê Arabica', 'ca-phe-arabica', 'Hạt Arabica hương hoa, vị chua thanh, hậu ngọt nhẹ.', 190000, 1, '/img/arabica.jpg', 50, 'light')
ON DUPLICATE KEY UPDATE name=VALUES(name);

-- Dữ liệu đánh giá mẫu (đã được duyệt)
INSERT INTO reviews (id, product_slug, author_name, rating, body, status, created_at) VALUES
(1, 'americano', 'Huy (Khách hàng)', 5, 'Cà phê rất đậm vị, thơm lừng. Giao hàng nhanh!', 'approved', NOW())
ON DUPLICATE KEY UPDATE body=VALUES(body), status=VALUES(status);

-- Dữ liệu ticket hỗ trợ mẫu
INSERT INTO tickets (id, subject, email, status, body, created_at) VALUES
(1, 'Hỏi về giao hàng nội thành', 'huy@gmail.com', 'open', 'Cho em hỏi giao hàng nội thành mất bao lâu ạ?', NOW()),
(2, 'Yêu cầu xuất hoá đơn đỏ VAT cho công ty', 'admin@gmail.com', 'answered', 'Vui lòng xuất hoá đơn VAT MST: 0316889922 - Công ty TNHH BrewCart Việt Nam.', NOW())
ON DUPLICATE KEY UPDATE body=VALUES(body);

-- Dữ liệu đơn hàng mẫu (Dành cho demo IDOR #10, #16)
INSERT INTO orders (id, user_id, customer_name, total_amount, status, items, notes, created_at) VALUES
(10, 1, 'Quản Trị Viên (Admin)', 2500000, 'completed', '[{"name":"Cà phê Moka Quý Hiếm","price":210000,"qty":10},{"name":"Máy pha Espresso Mini","price":400000,"qty":1}]', 'Đơn hàng VIP ban giám đốc. Mã bảo mật kho nội bộ: FLAG_VAULT_BREWCART_2026', NOW()),
(11, 2, 'Huy (Khách hàng)', 50000, 'pending', '[{"name":"Americano","price":50000,"qty":1}]', 'Giao hàng tận nơi giờ hành chính.', NOW())
ON DUPLICATE KEY UPDATE total_amount=VALUES(total_amount);
