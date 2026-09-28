const express = require('express');
const app = express();
const PORT = 8082;

app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`supplier-feed 2.1 — internal integration service
endpoints: /catalog (GET), /internal/keys (GET)`);
});

app.get('/catalog', (req, res) => {
    res.json({
        service: "supplier-feed",
        version: "2.1",
        beans: [
            { code: "VN-ROB-01", name: "Green Robusta Dak Lak Grade 1", stock_kg: 5000, price_per_kg: 75000 },
            { code: "VN-ARA-02", name: "Green Arabica Cau Dat Typica", stock_kg: 2400, price_per_kg: 140000 },
            { code: "VN-CHE-03", name: "Green Cherry Liberica Lam Dong", stock_kg: 1200, price_per_kg: 95000 }
        ]
    });
});

app.get('/internal/keys', (req, res) => {
    res.json({
        supplier_api_key: "sk_supplier_3b91f7c02e",
        signing_secret: "whk_live_staging_7f2c9a1b3e5d"
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[supplier-feed] Listening on port ${PORT}`);
});
