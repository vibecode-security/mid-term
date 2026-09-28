const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
const path = require('path');
const fs = require('fs');
const mysql = require('mysql2/promise');

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static directories
app.use('/img', express.static(path.join(__dirname, 'public/img')));

const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Phục vụ file upload với MIME-type cho phép thực thi XSS
app.use('/uploads', express.static(UPLOADS_DIR, {
    setHeaders: (res, filePath) => {
        const lower = filePath.toLowerCase();
        if (lower.endsWith('.shtml') || lower.endsWith('.html') || lower.endsWith('.xht') || lower.endsWith('.xhtml')) {
            res.setHeader('Content-Type', 'text/html; charset=utf-8');
        } else if (lower.endsWith('.svg') || lower.endsWith('.svgz')) {
            res.setHeader('Content-Type', 'image/svg+xml');
        }
    }
}));

// Helper phân tích Cookie
function parseCookies(req) {
    const list = {};
    const rc = req.headers.cookie;
    if (rc) {
        rc.split(';').forEach(cookie => {
            const parts = cookie.split('=');
            if (parts.length >= 2) {
                list[parts[0].trim()] = decodeURIComponent(parts.slice(1).join('=').trim());
            }
        });
    }
    return list;
}

// Cấu hình kết nối MySQL
let dbPool = null;
async function getDb() {
    if (!dbPool) {
        dbPool = mysql.createPool({
            host: process.env.DB_HOST || 'mysql',
            user: process.env.DB_USER || 'brewcart_user',
            password: process.env.DB_PASSWORD || 'brewcart_secret_db_2026',
            database: process.env.DB_NAME || 'brewcart',
            waitForConnections: true,
            connectionLimit: 10,
            queueLimit: 0
        });
    }
    return dbPool;
}

// Danh sách tài khoản người dùng chuẩn
const FALLBACK_USERS = [
    {
        id: 1,
        email: 'admin@gmail.com',
        password: 'Admin123!',
        name: 'Quản Trị Viên (Admin)',
        role: 'admin',
        loyalty_points: 5000,
        session_token: 'ADMIN_SESSION_TOKEN_89a3f2022_SECRET_KEY'
    },
    {
        id: 2,
        email: 'huy@gmail.com',
        password: 'user123',
        name: 'Huy (Khách hàng)',
        role: 'customer',
        loyalty_points: 50,
        session_token: 'USER_TOKEN_445566_STANDARD_DEV'
    },
    {
        id: 3,
        email: 'test@test.com',
        password: 'test123',
        name: 'Người Dùng Test',
        role: 'customer',
        loyalty_points: 100,
        session_token: 'TEST_TOKEN_778899_DEV'
    }
];

const FALLBACK_PRODUCTS = [
    { id: 1, name: 'Americano', slug: 'americano', description: 'Espresso pha loãng với nước nóng, nhẹ và thanh.', price: 50000, category_id: 2, category: 'Cà phê Ý', category_slug: 'ca-phe-y', image_url: '/img/americano.jpg', stock: 60, roast: 'dark', roast_label: 'rang đậm' },
    { id: 2, name: 'Mocha', slug: 'mocha', description: 'Espresso hoà chocolate và sữa, ngọt ngào thơm béo.', price: 60000, category_id: 2, category: 'Cà phê Ý', category_slug: 'ca-phe-y', image_url: '/img/mocha.jpg', stock: 59, roast: 'medium', roast_label: 'rang vừa' },
    { id: 3, name: 'Latte', slug: 'latte', description: 'Nhiều sữa nóng, lớp bọt mỏng, vị béo mượt nhẹ nhàng.', price: 55000, category_id: 2, category: 'Cà phê Ý', category_slug: 'ca-phe-y', image_url: '/img/latte.jpg', stock: 58, roast: 'light', roast_label: 'rang nhạt' },
    { id: 4, name: 'Macchiato', slug: 'macchiato', description: 'Espresso điểm chút bọt sữa, đậm vị cà phê.', price: 55000, category_id: 2, category: 'Cà phê Ý', category_slug: 'ca-phe-y', image_url: '/img/macchiato.jpg', stock: 57, roast: 'medium', roast_label: 'rang vừa' },
    { id: 5, name: 'Cappuccino', slug: 'cappuccino', description: 'Espresso + sữa nóng + lớp bọt sữa dày, cân bằng.', price: 55000, category_id: 2, category: 'Cà phê Ý', category_slug: 'ca-phe-y', image_url: '/img/cappuccino.jpg', stock: 56, roast: 'medium', roast_label: 'rang vừa' },
    { id: 6, name: 'Espresso', slug: 'espresso', description: 'Cà phê Ý cô đặc, chiết xuất áp suất, lớp crema vàng.', price: 45000, category_id: 2, category: 'Cà phê Ý', category_slug: 'ca-phe-y', image_url: '/img/espresso.jpg', stock: 55, roast: 'dark', roast_label: 'rang đậm' },
    { id: 7, name: 'Cà phê Moka', slug: 'ca-phe-moka', description: 'Moka quý hiếm, hương thơm sang trọng, vị chua thanh.', price: 210000, category_id: 1, category: 'Cà phê hạt', category_slug: 'ca-phe-hat', image_url: '/img/moka.jpg', stock: 54, roast: 'medium', roast_label: 'rang vừa' },
    { id: 8, name: 'Cà phê Cherry', slug: 'ca-phe-cherry', description: 'Cà phê Cherry (mít) hương thơm nồng, vị chua nhẹ.', price: 165000, category_id: 1, category: 'Cà phê hạt', category_slug: 'ca-phe-hat', image_url: '/img/cherry.jpg', stock: 53, roast: 'medium', roast_label: 'rang vừa' },
    { id: 9, name: 'Cà phê Culi', slug: 'ca-phe-culi', description: 'Hạt Culi tròn, vị đậm gắt, đắng mạnh đặc trưng.', price: 175000, category_id: 1, category: 'Cà phê hạt', category_slug: 'ca-phe-hat', image_url: '/img/culi.jpg', stock: 52, roast: 'dark', roast_label: 'rang đậm' },
    { id: 10, name: 'Cà phê Robusta', slug: 'ca-phe-robusta', description: 'Robusta Việt Nam đậm đắng, hàm lượng caffeine cao.', price: 150000, category_id: 1, category: 'Cà phê hạt', category_slug: 'ca-phe-hat', image_url: '/img/robusta.jpg', stock: 51, roast: 'dark', roast_label: 'rang đậm' },
    { id: 11, name: 'Cà phê Arabica', slug: 'ca-phe-arabica', description: 'Hạt Arabica hương hoa, vị chua thanh, hậu ngọt nhẹ.', price: 190000, category_id: 1, category: 'Cà phê hạt', category_slug: 'ca-phe-hat', image_url: '/img/arabica.jpg', stock: 50, roast: 'light', roast_label: 'rang nhạt' }
];

async function getUserByToken(token) {
    if (!token) return null;
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT * FROM users WHERE session_token = ?', [token]);
        if (rows.length > 0) return rows[0];
    } catch(e) {
        return FALLBACK_USERS.find(u => u.session_token === token) || null;
    }
    return null;
}

// Phục vụ default avatar
app.get('/default-avatar.svg', (req, res) => {
    res.setHeader('Content-Type', 'image/svg+xml');
    res.sendFile(path.join(__dirname, 'default-avatar.svg'));
});

// ========================================================================================
// 1. API AUTHENTICATION & LOGIN (Báo cáo #47: Không Rate Limit -> Brute force được)
// ========================================================================================
app.get(['/api/member/me', '/api/member/profile'], async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    if (user) {
        return res.json({ loggedIn: true, user });
    }
    return res.json({ loggedIn: false, user: null });
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = null;
        try {
            const db = await getDb();
            const [rows] = await db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password]);
            if (rows.length > 0) user = rows[0];
        } catch(e) {
            user = FALLBACK_USERS.find(u => u.email === email && u.password === password);
        }

        if (!user) {
            return res.status(401).json({ error: 'Email hoặc mật khẩu không chính xác!' });
        }

        res.setHeader('Set-Cookie', `session_token=${user.session_token}; Path=/; SameSite=Lax`);
        return res.json({ success: true, user });
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
});

app.post('/api/auth/logout', (req, res) => {
    res.setHeader('Set-Cookie', 'session_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    return res.json({ success: true });
});

app.post('/api/auth/register', async (req, res) => {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
        return res.status(400).json({ error: 'Vui lòng điền đầy đủ họ tên, email và mật khẩu!' });
    }
    try {
        const db = await getDb();
        const [existing] = await db.query('SELECT id FROM users WHERE email = ?', [email]);
        if (existing && existing.length > 0) {
            return res.status(400).json({ error: 'Email này đã được sử dụng!' });
        }
        const sessionToken = 'USER_TOKEN_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);
        const [result] = await db.query(
            'INSERT INTO users (email, password, name, role, loyalty_points, is_vip, session_token) VALUES (?, ?, ?, "customer", 50, 0, ?)',
            [email, password, name, sessionToken]
        );
        const newUser = { id: result.insertId, email, name, role: 'customer', loyalty_points: 50, is_vip: 0, session_token: sessionToken };
        res.setHeader('Set-Cookie', `session_token=${sessionToken}; Path=/; SameSite=Lax`);
        return res.json({ success: true, user: newUser });
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
});

// ========================================================================================
// 2. BROKEN ACCESS CONTROL: LỘ TOÀN BỘ EMAIL ADMIN & USERS (Báo cáo #3, #83)
// Endpoint: GET /api/admin/customers
// Lỗi: Không có middleware kiểm tra quyền Admin, bất kỳ ai cũng xem được danh sách người dùng!
// ========================================================================================
app.get(['/api/admin/customers', '/api/member/users', '/api/admin/users'], async (req, res) => {
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT id, email, name, role, loyalty_points, created_at FROM users ORDER BY id ASC');
        return res.json(rows);
    } catch(e) {
        return res.json(FALLBACK_USERS.map(u => ({
            id: u.id,
            email: u.email,
            name: u.name,
            role: u.role,
            loyalty_points: u.loyalty_points || 0,
            created_at: new Date().toISOString()
        })));
    }
});

// ========================================================================================
// 3. MASS ASSIGNMENT & SQL INJECTION (Báo cáo #2, #15, #18, #29, #30, #57)
// Endpoint: PATCH /api/member/me
// Lỗi 1 (Mass Assignment): Tự do cập nhật trường "role" lên "admin", "loyalty_points", v.v.
// Lỗi 2 (SQL Injection): Tham số 'email' được nối chuỗi trực tiếp vào câu lệnh SQL UPDATE!
// ========================================================================================
app.patch(['/api/member/me', '/api/member/profile'], async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    if (!user) {
        return res.status(401).json({ error: 'Vui lòng đăng nhập để cập nhật thông tin' });
    }

    const { name, email, role, loyalty_points, is_vip } = req.body;

    try {
        const db = await getDb();
        
        // VULNERABLE CODE: Nối chuỗi SQL thô trực tiếp từ input client (SQLi #29, #57)
        const updateParts = [];
        if (name !== undefined) {
            updateParts.push(`name = '${name.replace(/'/g, "\\'")}'`);
        }
        if (email !== undefined) {
            // Cố ý không escape để mô phỏng Time-based SQLi / Blind SQLi theo đúng writeup:
            updateParts.push(`email = '${email}'`);
        }
        if (role !== undefined) {
            // Mass Assignment leo quyền Admin (#2, #15, #30):
            updateParts.push(`role = '${role.replace(/'/g, "\\'")}'`);
        }
        if (loyalty_points !== undefined) {
            updateParts.push(`loyalty_points = ${Number(loyalty_points) || 0}`);
        }
        if (is_vip !== undefined) {
            updateParts.push(`is_vip = ${Number(is_vip) || 0}`);
        }

        if (updateParts.length > 0) {
            const rawSql = `UPDATE users SET ${updateParts.join(', ')} WHERE id = ${user.id}`;
            console.log(`[SQL EXECUTE] ${rawSql}`);
            await db.query(rawSql);
        }

        // Lấy lại user mới nhất
        const [updatedRows] = await db.query('SELECT * FROM users WHERE id = ?', [user.id]);
        return res.json({ success: true, user: updatedRows[0] });

    } catch(err) {
        console.error('[PROFILE UPDATE ERROR]', err);
        return res.status(500).json({ error: err.message });
    }
});

// ========================================================================================
// 4. IDOR TRUY CẬP ĐƠN HÀNG VÀ HOÁ ĐƠN (Báo cáo #10, #16)
// Endpoint: GET /api/member/orders/:id & GET /api/member/orders/:id/invoice
// Lỗi: Không kiểm tra quyền sở hữu đơn hàng (Missing user_id ownership check)
// ========================================================================================
app.get('/api/member/orders', async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    if (!user) return res.json([]);
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT * FROM orders WHERE user_id = ? ORDER BY id DESC', [user.id]);
        return res.json(rows);
    } catch(e) {
        return res.json([]);
    }
});

app.post('/api/member/orders', async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    if (!user) return res.status(401).json({ error: 'Vui lòng đăng nhập để đặt hàng' });
    const { items, total_amount, notes } = req.body;
    try {
        const db = await getDb();
        const itemsStr = typeof items === 'string' ? items : JSON.stringify(items || []);
        const [result] = await db.query(
            'INSERT INTO orders (user_id, customer_name, total_amount, status, items, notes) VALUES (?, ?, ?, "pending", ?, ?)',
            [user.id, user.name, total_amount || 0, itemsStr, notes || '']
        );
        return res.json({ success: true, orderId: result.insertId });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/member/orders/:id', async (req, res) => {
    const orderId = req.params.id;
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (rows.length === 0) {
            return res.status(404).json({ error: 'Không tìm thấy đơn hàng #' + orderId });
        }
        return res.json(rows[0]);
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
});

app.get('/api/member/orders/:id/invoice', async (req, res) => {
    const orderId = req.params.id;
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT * FROM orders WHERE id = ?', [orderId]);
        if (rows.length === 0) {
            return res.status(404).send('Không tìm thấy hoá đơn');
        }
        const order = rows[0];
        let items = [];
        try { items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e){}

        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        return res.send(`
            <!doctype html>
            <html>
            <head><meta charset="utf-8"><title>Hoá đơn #${order.id} - BrewCart</title>
            <style>body{font-family:sans-serif;padding:30px;max-width:600px;margin:auto;border:1px solid #ddd;border-radius:10px;line-height:1.6;}table{width:100%;border-collapse:collapse;margin:20px 0;}th,td{border-bottom:1px solid #eee;padding:8px;text-align:left;}</style>
            </head>
            <body>
                <h2>BrewCart — Hoá đơn điện tử #${order.id}</h2>
                <p>Khách hàng: <strong>${order.customer_name}</strong></p>
                <p>Trạng thái: <strong>${order.status}</strong></p>
                <table>
                    <thead><tr><th>Mặt hàng</th><th>Đơn giá</th><th>SL</th></tr></thead>
                    <tbody>
                        ${(items || []).map(i => `<tr><td>${i.name}</td><td>${Number(i.price).toLocaleString()}₫</td><td>${i.qty}</td></tr>`).join('')}
                    </tbody>
                </table>
                <h3>Tổng cộng: ${Number(order.total_amount).toLocaleString()}₫</h3>
                ${order.notes ? `<div style="background:#fff3cd;padding:10px;border-radius:6px;margin-top:15px;"><strong>Ghi chú bảo mật đơn hàng:</strong> ${order.notes}</div>` : ''}
            </body>
            </html>
        `);
    } catch(e) {
        return res.status(500).send(e.message);
    }
});

// ========================================================================================
// 5. STORED XSS & ADMIN DUYỆT ĐÁNH GIÁ (REVIEWS MODERATION) (Báo cáo #23, #87, #93)
// Endpoint: POST /api/member/products/:id/reviews & POST /api/store/reviews
// Lỗi: Lưu thẳng dữ liệu HTML không sanitize, render trực tiếp trong trang Admin bằng innerHTML!
// Khách gửi review -> Chờ admin duyệt (status='pending'). Admin duyệt -> Hiển thị công khai.
// ========================================================================================
app.get('/api/store/reviews', async (req, res) => {
    try {
        const db = await getDb();
        // Chỉ trả về các đánh giá đã được Admin phê duyệt (status='approved')
        const [rows] = await db.query('SELECT * FROM reviews WHERE status = "approved" ORDER BY id DESC');
        return res.json(rows);
    } catch(e) {
        return res.json([
            { id: 1, product_slug: 'americano', author_name: 'Huy (Khách hàng)', rating: 5, body: 'Cà phê rất đậm vị, thơm lừng. Giao hàng nhanh!', status: 'approved' }
        ]);
    }
});

app.post(['/api/store/reviews', '/api/member/products/:id/reviews'], async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    const { product_slug, rating, body, imageUrl } = req.body;
    const slug = req.params.id || product_slug || 'americano';

    if (!body) return res.status(400).json({ error: 'Nội dung không được để trống' });

    const author = user ? user.name : 'Khách hàng';
    try {
        const db = await getDb();
        // Đánh giá mới tạo có trạng thái 'pending' chờ Quản trị viên duyệt
        await db.query(
            'INSERT INTO reviews (product_slug, author_name, rating, body, status, image_url) VALUES (?, ?, ?, ?, "pending", ?)',
            [slug, author, Number(rating) || 5, body, imageUrl || null]
        );
        return res.json({ success: true, message: 'Đánh giá của bạn đã được gửi thành công và đang chờ Quản trị viên duyệt!' });
    } catch(e) {
        return res.json({ success: true, message: 'Đánh giá của bạn đã được gửi thành công và đang chờ Quản trị viên duyệt!' });
    }
});

// Admin lấy toàn bộ đánh giá để duyệt
app.get('/api/admin/reviews', async (req, res) => {
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT * FROM reviews ORDER BY id DESC');
        return res.json(rows);
    } catch(e) {
        return res.json([]);
    }
});

// Admin duyệt đánh giá
app.post('/api/admin/reviews/:id/approve', async (req, res) => {
    try {
        const db = await getDb();
        await db.query('UPDATE reviews SET status = "approved" WHERE id = ?', [req.params.id]);
        return res.json({ success: true, status: 'approved' });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
});

// Admin từ chối đánh giá
app.post('/api/admin/reviews/:id/reject', async (req, res) => {
    try {
        const db = await getDb();
        await db.query('UPDATE reviews SET status = "rejected" WHERE id = ?', [req.params.id]);
        return res.json({ success: true, status: 'rejected' });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
});

// Admin cập nhật trạng thái đánh giá qua PATCH (chuẩn BrewCart API)
app.patch('/api/admin/reviews/:id', async (req, res) => {
    const { status } = req.body;
    try {
        const db = await getDb();
        await db.query('UPDATE reviews SET status = ? WHERE id = ?', [status || 'approved', req.params.id]);
        return res.json({ ok: true, success: true, status: status || 'approved' });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
});

// ========================================================================================
// 6. INSECURE FILE UPLOAD & TICKET STORED XSS (Báo cáo #22, #32, #44, #77, #82)
// Endpoint: POST /api/member/support/tickets & POST /api/member/support/tickets/:id/attachments
// Lỗi: Cho phép upload file .shtml, .html, .svg chứa XSS payload và render unescaped!
// ========================================================================================
app.get('/api/member/support/tickets', async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    try {
        const db = await getDb();
        if (!user) return res.json([]);
        let query = 'SELECT * FROM tickets';
        let params = [];
        if (user.role !== 'admin') {
            query += ' WHERE email = ?';
            params.push(user.email);
        }
        query += ' ORDER BY id DESC';
        const [rows] = await db.query(query, params);
        return res.json(rows);
    } catch(e) {
        return res.json([]);
    }
});

app.post('/api/member/support/tickets', async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    const { subject, body } = req.body;

    const email = user ? user.email : 'guest@gmail.com';
    try {
        const db = await getDb();
        const [result] = await db.query(
            'INSERT INTO tickets (subject, email, status, body) VALUES (?, ?, "open", ?)',
            [subject, email, body]
        );
        return res.json({ success: true, ticketId: result.insertId });
    } catch(e) {
        return res.json({ success: true, ticketId: Date.now() });
    }
});

// File upload attachment không kiểm tra đuôi file (Unrestricted file upload)
app.post('/api/member/support/tickets/:id/attachments', async (req, res) => {
    const ticketId = req.params.id;
    const { filename, content } = req.body;

    if (!filename || !content) {
        return res.status(400).json({ error: 'Filename và content là bắt buộc' });
    }

    try {
        const safeName = path.basename(filename);
        const targetPath = path.join(UPLOADS_DIR, safeName);
        fs.writeFileSync(targetPath, content, 'utf8');

        const relativeUrl = `/uploads/${safeName}`;

        // Cập nhật đường dẫn file vào ticket trong MySQL
        try {
            const db = await getDb();
            await db.query('UPDATE tickets SET attachment_path = ? WHERE id = ?', [relativeUrl, ticketId]);
        } catch(e){}

        return res.json({ success: true, attachmentUrl: relativeUrl });
    } catch(err) {
        return res.status(500).json({ error: err.message });
    }
});

// ========================================================================================
// 7. SSRF FETCH-IMAGE API VỚI TRAILING DOT BYPASS (Báo cáo #18, #88, #89)
// Endpoint: POST /api/admin/products/:id/fetch-image
// Lỗi: Blacklist chuỗi hostname bị bypass bằng 'ops-internal.' hoặc IPv6, nip.io!
// ========================================================================================
app.post(['/api/admin/products/:id/fetch-image', '/api/admin/supplier-sync'], async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);

    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Chỉ quản trị viên mới có quyền sử dụng tính năng này' });
    }

    const { url } = req.body;
    if (!url) {
        return res.status(400).json({ error: 'URL không được để trống' });
    }

    try {
        const parsed = new URL(url);

        // BỘ LỌC BLACKLIST (Bị bypass bằng dấu chấm cuối: "ops-internal."):
        const BLACKLIST = ['127.0.0.1', 'localhost', 'ops-internal', 'supplier-feed', 'mailpit', 'mysql'];

        if (BLACKLIST.includes(parsed.hostname.toLowerCase())) {
            console.warn(`[SSRF FILTER BLOCKED] Hostname '${parsed.hostname}' is in blacklist!`);
            return res.status(502).json({ detail: "Chặn địa chỉ nội bộ" });
        }

        console.log(`[SSRF FETCHING] Allowed URL: ${url} (Hostname: '${parsed.hostname}')`);

        const upstream = await fetch(url, {
            headers: { 'User-Agent': 'BrewCart-Image-Fetcher/1.0' }
        });

        const contentType = upstream.headers.get('content-type') || 'text/plain';
        const text = await upstream.text();

        return res.json({
            ok: true,
            status: upstream.status,
            content_type: contentType,
            preview: text.length > 2000 ? text.substring(0, 2000) + '... (truncated)' : text
        });

    } catch (err) {
        console.error('[SSRF ERROR]', err);
        return res.status(500).json({ error: err.message });
    }
});

// ========================================================================================
// 8. CSV IMPORT VỚI GIÁ ÂM (Báo cáo #21)
// Endpoint: POST /api/admin/imports/csv
// ========================================================================================
app.post('/api/admin/imports/csv', async (req, res) => {
    const cookies = parseCookies(req);
    const user = await getUserByToken(cookies.session_token);
    if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Yêu cầu quyền Admin' });
    }

    const { csvData } = req.body;
    if (!csvData) return res.status(400).json({ error: 'Dữ liệu CSV trống' });

    try {
        const lines = csvData.trim().split('\n');
        const db = await getDb();
        let imported = 0;

        for (const line of lines) {
            const parts = line.split(',');
            if (parts.length >= 3) {
                const name = parts[0].trim();
                const price = parseInt(parts[1].trim());
                const category_id = parseInt(parts[2].trim()) || 1;
                const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

                await db.query(
                    'INSERT INTO products (name, slug, description, price, category_id, image_url, stock) VALUES (?, ?, ?, ?, ?, "/img/americano.jpg", 100) ON DUPLICATE KEY UPDATE price=VALUES(price)',
                    [name, slug, 'Sản phẩm nhập từ file CSV đối tác', price, category_id]
                );
                imported++;
            }
        }
        return res.json({ success: true, count: imported });
    } catch(e) {
        return res.status(500).json({ error: e.message });
    }
});

// API Danh sách sản phẩm từ MySQL
app.get('/api/store/products', async (req, res) => {
    try {
        const db = await getDb();
        const [rows] = await db.query(
            `SELECT p.*, c.name as category, c.slug as category_slug,
             CASE p.roast 
               WHEN 'dark' THEN 'rang đậm' 
               WHEN 'medium' THEN 'rang vừa' 
               ELSE 'rang nhạt' 
             END as roast_label
             FROM products p 
             JOIN categories c ON p.category_id = c.id
             ORDER BY p.id ASC`
        );
        if (rows.length > 0) return res.json(rows);
    } catch(e) {}
    return res.json(FALLBACK_PRODUCTS);
});

// API Danh sách danh mục
app.get('/api/store/categories', async (req, res) => {
    try {
        const db = await getDb();
        const [rows] = await db.query('SELECT * FROM categories');
        if (rows.length > 0) return res.json(rows);
    } catch(e) {}
    return res.json([
        { id: 1, name: 'Cà phê hạt', slug: 'ca-phe-hat' },
        { id: 2, name: 'Cà phê Ý', slug: 'ca-phe-y' }
    ]);
});

// ========================================================================================
// 9. GIAO DIỆN CHUẨN BREWCART (SPA FRONTEND HOÀN CHỈNH)
// ========================================================================================
// Phục vụ giao diện tĩnh và SPA HTML
app.use(express.static(path.join(__dirname, 'public')));

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[BrewCart Backend] Server listening on http://0.0.0.0:${PORT}`);
});
