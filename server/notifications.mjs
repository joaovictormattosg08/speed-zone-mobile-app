import { randomUUID } from 'node:crypto';

export function setupNotifications(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS notifications (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), title TEXT NOT NULL, target TEXT NOT NULL, created_at TEXT NOT NULL, read INTEGER NOT NULL DEFAULT 0);
    CREATE INDEX IF NOT EXISTS notifications_user ON notifications(user_id, created_at);
    CREATE TABLE IF NOT EXISTS stock_watches (user_id TEXT NOT NULL REFERENCES users(id), product_id TEXT NOT NULL, PRIMARY KEY(user_id, product_id));`);
}
const insert = (db, id, user, title, target, at) => db.prepare('INSERT OR IGNORE INTO notifications (id, user_id, title, target, created_at) VALUES (?, ?, ?, ?, ?)').run(id, user, title, target, at);

// Called at the stock mutation, including order cancellation, so changes while offline are retained.
export function notifyRestock(db, previous, product) {
  if (!previous || previous.stock > 0 || product.stock <= 0 || !product.published || product.archived) return;
  const event = randomUUID();
  for (const watch of db.prepare('SELECT user_id FROM stock_watches WHERE product_id = ?').all(product.id)) {
    insert(db, `${event}:${watch.user_id}`, watch.user_id, `${product.name} voltou ao estoque`, `/product/${encodeURIComponent(product.id)}`, new Date().toISOString());
  }
}

export function syncNotifications(db, userId, favorites) {
  if (!Array.isArray(favorites) || favorites.length > 5000 || favorites.some(id => typeof id !== 'string' || id.length > 100)) throw Object.assign(new Error('Favoritos inválidos.'), { status: 400 });
  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('DELETE FROM stock_watches WHERE user_id = ?').run(userId);
    for (const id of new Set(favorites)) db.prepare('INSERT INTO stock_watches VALUES (?, ?)').run(userId, id);
    const labels = { pending: 'Pendente', confirmed: 'Confirmado', processing: 'Em preparação', transit: 'Enviado', delivered: 'Entregue', cancelled: 'Cancelado' };
    for (const row of db.prepare('SELECT id, payload FROM orders WHERE user_id = ?').all(userId)) {
      const order = JSON.parse(row.payload);
      for (const [index, event] of (order.statusHistory || []).entries()) {
        insert(db, `order:${row.id}:${index}`, userId, `Pedido #${row.id}: ${labels[event.to] || event.to}`, `/order/${encodeURIComponent(row.id)}`, event.at);
      }
    }
    for (const row of db.prepare('SELECT id, payload FROM support_tickets WHERE user_id = ?').all(userId)) {
      for (const message of JSON.parse(row.payload).messages || []) {
        if (message.author === 'team') insert(db, `support:${row.id}:${message.id}`, userId, `A equipe respondeu ao chamado #${row.id}`, `/support-ticket/${encodeURIComponent(row.id)}`, message.createdAt);
      }
    }
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return db.prepare('SELECT id, title, target, created_at AS createdAt, read FROM notifications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 200').all(userId).map(item => ({ ...item, read: !!item.read }));
}

export function readNotifications(db, userId, id) {
  if (typeof id !== 'string' || id.length > 300) throw Object.assign(new Error('Aviso inválido.'), { status: 400 });
  if (id === 'all') db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ?').run(userId);
  else db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND id = ?').run(userId, id);
}
