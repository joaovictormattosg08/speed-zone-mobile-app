import { moveStock } from './products.mjs';
const failure = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
export function listAdminOrders(db) {
 return db.prepare('SELECT orders.payload, users.email FROM orders JOIN users ON users.id = orders.user_id ORDER BY orders.created_at DESC').all().map(row => ({ ...JSON.parse(row.payload), customerEmail: row.email }));
}
export function changeOrderStatus(db, actorId, id, body) {
 const transitions = { pending: ['confirmed','cancelled'], confirmed: ['processing','cancelled'], processing: ['transit','cancelled'], transit: ['delivered','cancelled'], delivered: [], cancelled: [] };
 if (!Object.hasOwn(transitions, body.status) || !Object.hasOwn(transitions, body.expectedStatus)) failure('Status inválido.');
 db.exec('BEGIN IMMEDIATE');
 try {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id); if (!row) failure('Pedido não encontrado.', 404);
  const order = JSON.parse(row.payload);
  if (order.status === body.status) { db.exec('COMMIT'); return order; }
  if (order.status !== body.expectedStatus) failure('O pedido foi alterado. Atualize a lista antes de tentar novamente.', 409);
  if (!transitions[order.status]?.includes(body.status)) failure('Esta mudança de status não é permitida.');
  const at = new Date().toISOString();
  if (body.status === 'cancelled') {
   if (order.stockReserved) { moveStock(db, order.items, 1); order.stockReserved = false; }
   const credit = db.prepare('SELECT points FROM loyalty_ledger WHERE id = ? AND user_id = ?').get('order:' + id, row.user_id);
   if (credit) db.prepare('INSERT OR IGNORE INTO loyalty_ledger VALUES (?, ?, ?, ?, ?)').run('cancel:' + id, row.user_id, -credit.points, `Estorno de pontos • pedido cancelado #${id}`, at);
  }
  order.statusHistory = [...(order.statusHistory || []), { from: order.status, to: body.status, at, actorId }];
  order.status = body.status; order.updatedAt = at;
  db.prepare('UPDATE orders SET payload = ? WHERE id = ?').run(JSON.stringify(order), id);
  db.exec('COMMIT'); return order;
 } catch(error) { db.exec('ROLLBACK'); throw error; }
}
