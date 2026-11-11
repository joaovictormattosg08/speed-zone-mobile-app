export function setupAdmin(db) {
 db.exec('CREATE TABLE IF NOT EXISTS administrators (user_id TEXT PRIMARY KEY REFERENCES users(id), granted_at TEXT NOT NULL)');
}
export function isAdmin(db, userId) { return !!db.prepare('SELECT 1 FROM administrators WHERE user_id = ?').get(userId); }
export function adminOverview(db) {
 const count = table => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
 const orders = db.prepare('SELECT id, created_at, payload FROM orders ORDER BY created_at DESC LIMIT 20').all().map(row => { const order = JSON.parse(row.payload); return { id: row.id, date: row.created_at, recipient: order.recipient || 'Piloto', status: order.status, total: order.total }; });
 const all = db.prepare('SELECT payload FROM orders').all().map(row => JSON.parse(row.payload));
 const valid = all.filter(order => order.status !== 'cancelled');
 const dayFormat = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' });
 const updatedAt = new Date();
 const today = dayFormat.format(updatedAt);
 let ordersToday = 0;
 const lowStockCount = db.prepare(`SELECT COUNT(*) AS total FROM products
   WHERE json_extract(payload, '$.published') = 1
   AND COALESCE(json_extract(payload, '$.archived'), 0) = 0
   AND json_extract(payload, '$.stock') <= json_extract(payload, '$.minimum')`).get().total;
 const daily = new Map();
 for (const order of valid) { const day = dayFormat.format(new Date(order.createdAt)); if (day === today) ordersToday++; daily.set(day, (daily.get(day) || 0) + order.total); }
 const openTickets = db.prepare("SELECT COUNT(*) AS total FROM support_tickets WHERE json_extract(payload, '$.status') = 'open'").get().total;
 return { salesTotal: valid.reduce((sum, order) => sum + order.total, 0), processing: valid.filter(order => order.status === 'processing').length, openTickets, dailySales: Array.from(daily, ([date, total]) => ({ date, total })), updatedAt: updatedAt.toISOString(), ordersToday, lowStockCount, customers: count('users'), ordersCount: count('orders'), tickets: count('support_tickets'), coupons: count('loyalty_coupons'), orders };
}
