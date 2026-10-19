import { randomUUID } from 'node:crypto';
import { calculateCart, shippingOptions } from '../src/utils/cartPricing.ts';
// Local demonstration catalog; production checkout requires the inventory service.
const catalog = [
  ['SZ-TUR-660-TS', 'Turbocompressor Billet Garrett G25-660 Twin Scroll T4 .82 A/R', 7890],
  ['SZ-TUR-042', 'Turbocompressor Garrett GT2871R Ball Bearing', 4850],
  ['SZ-INT-108', 'Kit Intercooler Frontal Alumínio Billet Racing', 2390],
  ['SZ-ELT-220', 'Bobinas de Ignição R8 Red Edition (4 un)', 799],
  ['SZ-BRK-512', 'Kit Freios Big Brake 6 Pistões 355mm', 6200],
  ['SZ-ACC-015', 'Mangote Pressurização 3"', 145],
];
const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
export function setupOrders(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(user_id, request_key)); CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created_at);`);
}
export function listOrders(db, userId) {
  return db.prepare('SELECT payload FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(row => JSON.parse(row.payload));
}
export function placeOrder(db, user, body) {
  if (typeof body.requestKey !== 'string' || !/^[\w-]{8,100}$/.test(body.requestKey)) invalid('Identificador de compra inválido.');
  const existing = db.prepare('SELECT payload FROM orders WHERE user_id = ? AND request_key = ?').get(user.id, body.requestKey);
  if (existing) return JSON.parse(existing.payload);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > catalog.length) invalid('Adicione produtos ao pedido.');
  const ids = new Set();
  const items = body.items.map(item => {
    const product = catalog.find(product => product[0] === item?.id);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 5 || ids.has(item.id)) invalid('Produto ou quantidade inválida.');
    ids.add(item.id);
    return { id: product[0], name: product[1], price: product[2], quantity: item.quantity };
  });
  if (body.coupon != null && typeof body.coupon !== 'string') invalid('Cupom inválido.');
  if (!body.delivery || typeof body.delivery.cep !== 'string' || !['standard', 'express'].includes(body.delivery.service)) invalid('Calcule o frete e escolha uma opção de entrega.');
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const delivery = shippingOptions(body.delivery.cep, subtotal).find(option => option.service === body.delivery.service);
  if (!delivery) invalid('CEP inválido para simular o frete.');
  const totals = calculateCart(items, body.coupon || null, delivery);
  if (body.coupon && !totals.validCoupon) invalid('O cupom não é válido para este pedido.');
  const id = `SZ-${randomUUID().slice(0, 8).toUpperCase()}`;
  const profile = JSON.parse(user.profile);
  const order = { id, createdAt: new Date().toISOString(), status: 'processing', demo: true, items, delivery, subtotal: totals.subtotal, discount: totals.discount, shipping: totals.shipping, total: totals.total, coupon: totals.validCoupon, address: profile.address || '', tracking: null };
  db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)').run(id, user.id, body.requestKey, order.createdAt, JSON.stringify(order));
  return order;
}
