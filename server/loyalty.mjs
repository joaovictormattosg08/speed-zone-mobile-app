import { randomUUID } from 'node:crypto';
import { rewards } from '../src/data/loyalty.ts';
const fail = message => { throw Object.assign(new Error(message), { status: 400 }); };
export function setupLoyalty(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS loyalty_ledger (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), points INTEGER NOT NULL, label TEXT NOT NULL, createdAt TEXT NOT NULL);
  CREATE INDEX IF NOT EXISTS loyalty_user ON loyalty_ledger(user_id);
  CREATE TABLE IF NOT EXISTS loyalty_coupons (code TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, reward_id TEXT NOT NULL, created_at TEXT NOT NULL, used_order TEXT, UNIQUE(user_id,request_key));`);
  // Idempotent migration of existing demonstration purchases, excluding cancelled orders.
  db.exec('BEGIN IMMEDIATE');
  try {
    for (const row of db.prepare('SELECT user_id, payload FROM orders').all()) {
      const order = JSON.parse(row.payload);
      if (order.status !== 'cancelled') creditOrder(db, row.user_id, order);
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function creditOrder(db, userId, order) {
  const points = Math.floor(Math.max(0, order.subtotal - order.discount) / 100);
  db.prepare('INSERT OR IGNORE INTO loyalty_ledger VALUES (?, ?, ?, ?, ?)').run('order:' + order.id, userId, points, `Compra demonstrativa #${order.id}`, order.createdAt);
  return points;
}
function couponView(row) { const reward = rewards.find(r => r.id === row.reward_id); return { ...reward, rewardId: reward.id, code: row.code, createdAt: row.created_at, usedOrder: row.used_order }; }
export function getLoyalty(db, userId) {
  const history = db.prepare('SELECT id, points, label, createdAt FROM loyalty_ledger WHERE user_id = ? ORDER BY createdAt DESC, id DESC').all(userId);
  const earned = history.reduce((sum, item) => sum + Math.max(0, item.points), 0), spent = history.reduce((sum, item) => sum + (item.id.startsWith('redeem:') ? Math.max(0, -item.points) : 0), 0), reversed = history.reduce((sum, item) => sum + (item.id.startsWith('cancel:') ? Math.max(0, -item.points) : 0), 0);
  return { balance: earned - spent - reversed, earned, spent, reversed, history, coupons: db.prepare('SELECT * FROM loyalty_coupons WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(couponView) };
}
export function redeem(db, userId, body) {
  if (typeof body.requestKey !== 'string' || !/^[\w-]{8,100}$/.test(body.requestKey)) fail('Identificador de resgate inválido.');
  const reward = rewards.find(r => r.id === body.rewardId); if (!reward) fail('Recompensa inválida.');
  db.exec('BEGIN IMMEDIATE');
  try {
    const existing = db.prepare('SELECT * FROM loyalty_coupons WHERE user_id = ? AND request_key = ?').get(userId, body.requestKey);
    if (existing) { if (existing.reward_id !== reward.id) fail('Identificador já usado em outro resgate.'); db.exec('COMMIT'); return couponView(existing); }
    if (getLoyalty(db, userId).balance < reward.cost) fail('Pontos insuficientes para esta recompensa.');
    const code = 'SP-' + randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase(), createdAt = new Date().toISOString();
    db.prepare('INSERT INTO loyalty_coupons VALUES (?, ?, ?, ?, ?, NULL)').run(code, userId, body.requestKey, reward.id, createdAt);
    db.prepare('INSERT INTO loyalty_ledger VALUES (?, ?, ?, ?, ?)').run('redeem:' + code, userId, -reward.cost, `Resgate ${reward.label} • ${code}`, createdAt);
    db.exec('COMMIT'); return { ...reward, rewardId: reward.id, code, createdAt, usedOrder: null };
  } catch (error) { db.exec('ROLLBACK'); throw error; }
}
export function ownCoupon(db, userId, code) {
  if (!code?.startsWith('SP-')) return null;
  const row = db.prepare('SELECT * FROM loyalty_coupons WHERE code = ? AND user_id = ? AND used_order IS NULL').get(code, userId);
  if (!row) fail('Cupom indisponível, já utilizado ou não pertence à sua conta.');
  return couponView(row);
}
export function consumeCoupon(db, userId, code, orderId) {
  const result = db.prepare('UPDATE loyalty_coupons SET used_order = ? WHERE code = ? AND user_id = ? AND used_order IS NULL').run(orderId, code, userId);
  if (result.changes !== 1) fail('Este cupom não está mais disponível.');
}
