const express = require('express');
const app = express();
const PORT = 8081;

// Endpoint trang chủ Ops Console (tiết lộ topology nội bộ)
app.get('/', (req, res) => {
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.send(`BrewCart Ops Console version: brewcart-ops 1.4.2
Topology:
  supplier-feed -> http://supplier-feed:8082/
  mailpit       -> http://mailpit:8025/
  mysql         -> mysql:3306
Worker token: ops_wkr_9a8f... (truncated)`);
});

// Endpoint đọc biến môi trường nội bộ
app.get('/env', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.json({
        APP_ENV: "production",
        INTERNAL_API_TOKEN: "ops_internal_9d4f21ac77e0",
        DB_HOST: "mysql",
        SUPPLIER_FEED_URL: "http://supplier-feed:8082"
    });
});

app.listen(PORT, '0.0.0.0', () => {
    console.log(`[ops-internal] Listening on port ${PORT}`);
});
