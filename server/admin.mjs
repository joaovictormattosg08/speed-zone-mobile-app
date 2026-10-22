export function setupAdmin(db) {
 db.exec('CREATE TABLE IF NOT EXISTS administrators (user_id TEXT PRIMARY KEY REFERENCES users(id), granted_at TEXT NOT NULL)');
}
export function isAdmin(db, userId) { return !!db.prepare('SELECT 1 FROM administrators WHERE user_id = ?').get(userId); }
export function adminOverview(db) {
 const count = table => db.prepare(`SELECT COUNT(*) AS total FROM ${table}`).get().total;
 const orders = db.prepare('SELECT id, created_at, payload FROM orders ORDER BY created_at DESC LIMIT 20').all().map(row => { const order = JSON.parse(row.payload); return { id: row.id, date: row.created_at, recipient: order.recipient || 'Piloto', status: order.status, total: order.total }; });
 const all = db.prepare('SELECT payload FROM orders').all().map(row => JSON.parse(row.payload));
 const valid = all.filter(order => order.status !== 'cancelled');
 const daily = new Map();
 for (const order of valid) { const day = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(order.createdAt)); daily.set(day, (daily.get(day) || 0) + order.total); }
 const openTickets = db.prepare("SELECT COUNT(*) AS total FROM support_tickets WHERE json_extract(payload, '$.status') = 'open'").get().total;
 return { salesTotal: valid.reduce((sum, order) => sum + order.total, 0), processing: valid.filter(order => order.status === 'processing').length, openTickets, dailySales: Array.from(daily, ([date, total]) => ({ date, total })), updatedAt: new Date().toISOString(), customers: count('users'), ordersCount: count('orders'), tickets: count('support_tickets'), coupons: count('loyalty_coupons'), orders };
}
