import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createApi } from './index.mjs';

test('customer notices: authorization, offline updates, restock, read state and restart', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'speedzone-notifications-'));
  const database = join(directory, 'test.sqlite');
  let server = createApi({ database });
  const listen = () => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const close = () => new Promise(resolve => server.close(resolve));
  await listen();
  const call = async (path, body, token, method = 'POST') => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    return { status: response.status, data: await response.json() };
  };
  let fixture;
  try {
    const account = { name: 'Ana', surname: 'Teste', email: 'ana@example.com', password: 'SenhaTeste123!' };
    const admin = (await call('/auth/register', account)).data;
    const customer = (await call('/auth/register', { ...account, email: 'customer@example.com' })).data;
    const other = (await call('/auth/register', { ...account, email: 'other@example.com' })).data;
    const sync = (token = customer.token, favorites = ['SZ-TUR-042']) => call('/notifications/sync', { favorites }, token);
    assert.equal((await call('/notifications/sync', { favorites: [] })).status, 401);
    assert.equal((await call('/notifications/sync', { favorites: [3] }, customer.token)).status, 400);
    assert.equal((await sync()).data.notifications.length, 0);
    fixture = new DatabaseSync(database);
    const at = new Date().toISOString();
    fixture.prepare('INSERT INTO orders VALUES (?, ?, ?, ?, ?)').run('ORDER-TEST', customer.user.id, 'order-request', at, JSON.stringify({ id: 'ORDER-TEST', status: 'transit', subtotal: 10000, discount: 0, createdAt: at, statusHistory: [{ to: 'transit', at }] }));
    fixture.prepare('INSERT INTO support_tickets VALUES (?, ?, ?, ?, ?)').run('TICKET-TEST', customer.user.id, 'ticket-request', at, JSON.stringify({ messages: [{ id: 'reply-1', author: 'team', createdAt: at }, { id: 'pilot-1', author: 'pilot', createdAt: at }] }));
    let product = JSON.parse(fixture.prepare('SELECT payload FROM products WHERE id = ?').get('SZ-TUR-042').payload);
    product.stock = 0;
    fixture.prepare('UPDATE products SET payload = ? WHERE id = ?').run(JSON.stringify(product), product.id);
    // Restock while the customer has no active poll.
    const updated = await call('/admin/products/' + product.id, { ...product, stock: 5 }, admin.token, 'PATCH');
    assert.equal(updated.status, 200);
    product = updated.data.product;
    assert.equal((await call('/admin/products/' + product.id, { ...product, stock: 6 }, admin.token, 'PATCH')).status, 200);
    const feed = (await sync()).data.notifications;
    assert.equal(feed.length, 3);
    assert.ok(feed.some(item => item.target === '/order/ORDER-TEST'));
    assert.ok(feed.some(item => item.target === '/support-ticket/TICKET-TEST'));
    assert.equal(feed.filter(item => item.target.startsWith('/product/')).length, 1);
    assert.equal((await sync()).data.notifications.length, 3);
    assert.equal((await sync(other.token)).data.notifications.length, 0);
    await call('/notifications/read', { id: feed[0].id }, other.token);
    assert.equal((await sync()).data.notifications.find(item => item.id === feed[0].id).read, false);
    await call('/notifications/read', { id: feed[0].id }, customer.token);
    assert.equal((await sync()).data.notifications.find(item => item.id === feed[0].id).read, true);
    await call('/notifications/read', { id: 'all' }, customer.token);
    // Removing the favorite stops future restock alerts.
    await sync(customer.token, []);
    product = JSON.parse(fixture.prepare('SELECT payload FROM products WHERE id = ?').get(product.id).payload);
    const emptied = await call('/admin/products/' + product.id, { ...product, stock: 0 }, admin.token, 'PATCH');
    await call('/admin/products/' + product.id, { ...emptied.data.product, stock: 4 }, admin.token, 'PATCH');
    assert.equal((await sync(customer.token, [])).data.notifications.length, 3);
    fixture.close(); fixture = null;
    await close(); server = createApi({ database }); await listen();
    const restored = (await sync(customer.token, [])).data.notifications;
    assert.equal(restored.length, 3);
    assert.ok(restored.every(item => item.read));
  } finally { fixture?.close(); if (server.listening) await close(); await rm(directory, { recursive: true, force: true }); }
});


test('device watches remain independent, deduplicate restock and preserve migration', async () => {
  const { setupNotifications, syncNotifications, notifyRestock } = await import('./notifications.mjs');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE users(id TEXT PRIMARY KEY); INSERT INTO users VALUES ('pilot'); CREATE TABLE orders(id TEXT,user_id TEXT,payload TEXT); CREATE TABLE support_tickets(id TEXT,user_id TEXT,payload TEXT); CREATE TABLE stock_watches(user_id TEXT,product_id TEXT,PRIMARY KEY(user_id,product_id)); INSERT INTO stock_watches VALUES ('pilot','PART');");
    setupNotifications(db);
    assert.equal(db.prepare('SELECT device_id FROM stock_watches').get().device_id, 'legacy');
    syncNotifications(db, 'pilot', [], 'phone-B');
    assert.equal(db.prepare('SELECT count(*) AS count FROM stock_watches').get().count, 1);
    syncNotifications(db, 'pilot', ['PART'], 'phone-A');
    syncNotifications(db, 'pilot', ['PART'], 'phone-B');
    syncNotifications(db, 'pilot', [], 'phone-B');
    notifyRestock(db, { stock: 0 }, { id: 'PART', name: 'Peça', stock: 1, published: true });
    assert.equal(syncNotifications(db, 'pilot', ['PART'], 'phone-A').length, 1);
    syncNotifications(db, 'pilot', ['PART'], 'phone-B');
    notifyRestock(db, { stock: 0 }, { id: 'PART', name: 'Peça', stock: 1, published: true });
    assert.equal(syncNotifications(db, 'pilot', ['PART'], 'phone-A').length, 2);
    syncNotifications(db, 'pilot', [], 'phone-A');
    syncNotifications(db, 'pilot', [], 'phone-B');
    notifyRestock(db, { stock: 0 }, { id: 'PART', name: 'Peça', stock: 1, published: true });
    assert.equal(syncNotifications(db, 'pilot', [], 'phone-A').length, 2);
    setupNotifications(db);
  } finally { db.close(); }
});

test('old unread notices stay visible beyond 200 and can be marked read', async () => {
  const { setupNotifications, syncNotifications, readNotifications } = await import('./notifications.mjs');
  const db = new DatabaseSync(':memory:');
  try {
    db.exec("CREATE TABLE users(id TEXT PRIMARY KEY); INSERT INTO users VALUES ('pilot'); CREATE TABLE orders(id TEXT,user_id TEXT,payload TEXT); CREATE TABLE support_tickets(id TEXT,user_id TEXT,payload TEXT);");
    setupNotifications(db);
    for (let i = 0; i < 405; i++) db.prepare('INSERT INTO notifications VALUES (?,?,?,?,?,?)').run('notice-' + i, 'pilot', 'Aviso', '/product/PART', new Date(1700000000000 + i * 1000).toISOString(), i < 205 ? 0 : 1);
    const feed = syncNotifications(db, 'pilot', [], 'phone-A');
    assert.equal(feed.filter(item => !item.read).length, 205);
    assert.ok(feed.some(item => item.id === 'notice-0'));
    readNotifications(db, 'pilot', 'all');
    assert.equal(syncNotifications(db, 'pilot', [], 'phone-A').filter(item => !item.read).length, 0);
  } finally { db.close(); }
});
