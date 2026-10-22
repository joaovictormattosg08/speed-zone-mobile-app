import { ownCoupon, consumeCoupon, creditOrder } from './loyalty.mjs';
import { listProducts, setupProducts, moveStock } from './products.mjs';
import { randomUUID } from 'node:crypto';
import { calculateCart, shippingOptions } from '../src/utils/cartPricing.ts';
const invalid = message => { throw Object.assign(new Error(message), { status: 400 }); };
export function setupOrders(db) {
  setupProducts(db);
  db.exec(`CREATE TABLE IF NOT EXISTS orders (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, created_at TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(user_id, request_key)); CREATE INDEX IF NOT EXISTS orders_user ON orders(user_id, created_at);`);
}
export function listOrders(db, userId) {
  return db.prepare('SELECT payload FROM orders WHERE user_id = ? ORDER BY created_at DESC').all(userId).map(row => JSON.parse(row.payload));
}
export function placeOrder(db, user, body) {
  if (typeof body.requestKey !== 'string' || !/^[\w-]{8,100}$/.test(body.requestKey)) invalid('Identificador de compra inválido.');
  const existing = db.prepare('SELECT payload FROM orders WHERE user_id = ? AND request_key = ?').get(user.id, body.requestKey);
  if (existing) return JSON.parse(existing.payload);
  const catalog = listProducts(db);
  if (!Array.isArray(body.items) || !body.items.length || body.items.length > catalog.length) invalid('Adicione produtos ao pedido.');
  const ids = new Set();
  const items = body.items.map(item => {
    const product = catalog.find(product => product.id === item?.id);
    if (!product || !Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > product.stock || ids.has(item.id)) invalid('Produto indisponível ou quantidade acima do estoque.');
    ids.add(item.id);
    return { id: product.id, name: product.name, price: product.price, quantity: item.quantity };
  });
  if (body.coupon != null && typeof body.coupon !== 'string') invalid('Cupom inválido.');
  if (!body.delivery || typeof body.delivery.cep !== 'string' || !['standard', 'express'].includes(body.delivery.service)) invalid('Calcule o frete e escolha uma opção de entrega.');
  const subtotal = items.reduce((sum, item) => sum + Math.round(item.price * 100) * item.quantity, 0);
  const delivery = shippingOptions(body.delivery.cep, subtotal).find(option => option.service === body.delivery.service);
  if (!delivery) invalid('CEP inválido para simular o frete.');
  const reward = ownCoupon(db, user.id, body.coupon);
  const totals = calculateCart(items, body.coupon || null, delivery, reward);
  if (body.coupon && !totals.validCoupon) invalid('O cupom não é válido para este pedido.');
  let checkout;
  if (body.checkout !== undefined) {
    const value = body.checkout;
    if (!value || typeof value.recipient !== 'string' || value.recipient.trim().length < 3 || value.recipient.length > 140 || typeof value.address !== 'string' || value.address.trim().length < 10 || value.address.length > 500 || typeof value.instructions !== 'string' || value.instructions.length > 1000 || !['pix', 'card'].includes(value.payment)) invalid('Confira o destinatário, endereço e forma de pagamento.');
    checkout = { recipient: value.recipient.trim(), address: value.address.trim(), instructions: value.instructions.trim(), payment: value.payment };
  }
  const id = `SZ-${randomUUID().slice(0, 8).toUpperCase()}`;
  const profile = JSON.parse(user.profile);
  const order = { deliveryAddress: profile.deliveryAddress?.cep === delivery.cep ? profile.deliveryAddress : undefined, checkout, recipient: checkout?.recipient || `${profile.name} ${profile.surname}`, id, createdAt: new Date().toISOString(), status: 'processing', demo: true, items, delivery, subtotal: totals.subtotal, discount: totals.discount, shipping: totals.shipping, total: totals.total, coupon: totals.validCoupon, address: checkout?.address || profile.address || '', tracking: null };
  db.exec('BEGIN IMMEDIATE');
  try {
    moveStock(db, items, -1);
    order.stockReserved = true;
    if (reward) consumeCoupon(db, user.id, reward.code, id);
    order.pointsEarned = creditOrder(db, user.id, order);
    order.delivery = { ...delivery, price: totals.shipping };
    db.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)').run(id, user.id, body.requestKey, order.createdAt, JSON.stringify(order));
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return order;
}
