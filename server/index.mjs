import { listAdminOrders, changeOrderStatus } from './admin-orders.mjs';
import { setupAdmin, isAdmin, adminOverview } from './admin.mjs';
import { setupLoyalty, getLoyalty, redeem } from './loyalty.mjs';
import { addressError, formatAddress } from '../src/utils/address.ts';
import { createServer } from 'node:http';
import { DatabaseSync } from 'node:sqlite';
import { randomBytes, randomUUID, scrypt, timingSafeEqual, createHash } from 'node:crypto';
import { promisify } from 'node:util';
import { mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { setupOrders, listOrders, placeOrder } from './orders.mjs';
import { setupSupport, listTickets, getTicket, createTicket, updateTicket } from './support.mjs';

const derive = promisify(scrypt);
const digest = value => createHash('sha256').update(value).digest('hex');
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const field = (value, label, min = 0, max = 120) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(`${label}: valor inválido.`);
  return value.trim();
};
const emailOf = value => {
  const email = field(value, 'E-mail', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Informe um e-mail válido.');
  return email;
};
export function createApi({ database = resolve('server/data/speedzone.sqlite') } = {}) {
  mkdirSync(dirname(database), { recursive: true });
  const db = new DatabaseSync(database);
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
    CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT UNIQUE NOT NULL, password TEXT NOT NULL, profile TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS sessions (hash TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), expires INTEGER NOT NULL);`);
  setupAdmin(db);
  setupOrders(db);
  setupLoyalty(db);
  setupSupport(db);
  const attempts = new Map();
  const publicUser = row => ({ ...JSON.parse(row.profile), id: row.id, email: row.email, isAdmin: isAdmin(db, row.id) });
  const server = createServer(async (req, res) => {
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin;
    const allowed = origin && (/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) || (process.env.API_ALLOWED_ORIGINS || '').split(',').includes(origin));
    const cookie = (token, remember = false) => res.setHeader('Set-Cookie', `speedzone_session=${token}; HttpOnly; SameSite=Lax; Path=/${remember ? '; Max-Age=2592000' : ''}${!token ? '; Max-Age=0' : ''}${process.env.COOKIE_SECURE === 'true' ? '; Secure' : ''}`);
    const send = (data, status = 200) => { res.writeHead(status); res.end(JSON.stringify(data)); };
    try {
      if (origin && !allowed) fail('Origem não permitida.', 403);
      if (allowed) { res.setHeader('Access-Control-Allow-Origin', origin); res.setHeader('Vary', 'Origin'); res.setHeader('Access-Control-Allow-Credentials', 'true'); }
      if (req.method === 'OPTIONS') { res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS'); res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization'); res.writeHead(204); res.end(); return; }
      const path = req.url?.split('?')[0];
      if (path === '/health') return send({ ok: true });
      let body = {};
      if (['POST', 'PATCH'].includes(req.method)) {
        if (!req.headers['content-type']?.startsWith('application/json')) fail('Envie JSON.', 415);
        let size = 0; const chunks = [];
        for await (const chunk of req) { size += chunk.length; if (size > 7_100_000) fail('Arquivo muito grande. Limite: 5 MB.', 413); chunks.push(chunk); }
        try { body = JSON.parse(Buffer.concat(chunks).toString() || '{}'); } catch { fail('JSON inválido.'); }
        if (!body || Array.isArray(body) || typeof body !== 'object') fail('Dados inválidos.');
      }
      if (req.method === 'POST' && ['/auth/register', '/auth/login'].includes(path)) {
        const ip = req.socket.remoteAddress;
        const now = Date.now(); const previous = attempts.get(ip);
        const limit = previous && previous.until > now ? previous : { count: 0, until: now + 60_000 };
        attempts.set(ip, limit); if (++limit.count > 20) fail('Muitas tentativas. Aguarde um minuto.', 429);
        const email = emailOf(body.email);
        if (typeof body.password !== 'string' || body.password.length < 8 || body.password.length > 128) fail('A senha deve ter entre 8 e 128 caracteres.');
        let row = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
        if (path.endsWith('register')) {
          const name = field(body.name, 'Nome', 1, 60); const surname = field(body.surname, 'Sobrenome', 1, 80);
          if (row) fail('Este e-mail já está cadastrado.', 409);
          const salt = randomBytes(16).toString('hex');
          const hash = (await derive(body.password, salt, 64)).toString('hex');
          const id = randomUUID(); const profile = JSON.stringify({ name, surname, phone: '', photo: null, cars: [], activeCarId: null, address: '' });
          try { db.prepare('INSERT INTO users VALUES (?, ?, ?, ?)').run(id, email, `${salt}:${hash}`, profile); } catch (error) { if (String(error).includes('UNIQUE')) fail('Este e-mail já está cadastrado.', 409); throw error; }
          row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
        } else {
          const [salt, hash] = (row?.password || `${'0'.repeat(32)}:${'0'.repeat(128)}`).split(':');
          const candidate = await derive(body.password, salt, 64);
          if (!row || !timingSafeEqual(candidate, Buffer.from(hash, 'hex'))) fail('E-mail ou senha incorretos.', 401);
        }
        const token = randomBytes(32).toString('hex');
        db.prepare('DELETE FROM sessions WHERE expires < ?').run(Date.now());
        db.prepare('INSERT INTO sessions VALUES (?, ?, ?)').run(digest(token), row.id, Date.now() + (body.remember ? 30 : 1) * 86400000);
        cookie(token, !!body.remember);
        return send({ user: publicUser(row), ...(origin ? {} : { token }) }, path.endsWith('register') ? 201 : 200);
      }
      const token = req.headers.authorization?.replace(/^Bearer /, '') || req.headers.cookie?.match(/(?:^|; )speedzone_session=([a-f0-9]+)/)?.[1] || '';
      const row = db.prepare('SELECT users.* FROM sessions JOIN users ON users.id = sessions.user_id WHERE sessions.hash = ? AND expires > ?').get(digest(token), Date.now());
      if (!row) fail('Entre na sua conta para continuar.', 401);
      if (path?.startsWith('/admin')) {
        if (!isAdmin(db, row.id)) fail('Acesso restrito a administradores.', 403);
        if (path === '/admin/overview' && req.method === 'GET') return send(adminOverview(db));
        if (path === '/admin/orders' && req.method === 'GET') return send({ orders: listAdminOrders(db) });
        const orderId = path.match(/^\/admin\/orders\/(SZ-[A-F0-9]{8})$/)?.[1];
        if (orderId && req.method === 'PATCH') return send({ order: changeOrderStatus(db, row.id, orderId, body) });
        fail('Rota administrativa não encontrada.', 404);
      }
      if (path === '/support/tickets' && req.method === 'GET') return send({ tickets: listTickets(db, row.id) });
      if (path === '/support/tickets' && req.method === 'POST') return send({ ticket: createTicket(db, row, body) }, 201);
      const ticketId = path?.match(/^\/support\/tickets\/(TK-[A-F0-9]{8})$/)?.[1];
      if (ticketId && req.method === 'GET') return send({ ticket: getTicket(db, row.id, ticketId) });
      if (ticketId && req.method === 'PATCH') return send({ ticket: updateTicket(db, row.id, ticketId, body) });
      if (path === '/loyalty' && req.method === 'GET') return send(getLoyalty(db, row.id));
      if (path === '/loyalty/redeem' && req.method === 'POST') return send({ coupon: redeem(db, row.id, body) }, 201);
      if (path === '/orders' && req.method === 'GET') return send({ orders: listOrders(db, row.id) });
      if (path === '/orders' && req.method === 'POST') return send({ order: placeOrder(db, row, body) }, 201);
      if (path === '/auth/logout' && req.method === 'POST') { db.prepare('DELETE FROM sessions WHERE hash = ?').run(digest(token)); cookie(''); return send({ ok: true }); }
      if (path === '/me' && req.method === 'GET') return send({ user: publicUser(row) });
      if (path === '/me' && req.method === 'PATCH') {
        const profile = JSON.parse(row.profile);
        for (const key of ['name', 'surname', 'phone', 'address']) if (key in body) profile[key] = field(body[key], key, ['name', 'surname'].includes(key) ? 1 : 0, key === 'address' ? 300 : 80);
        if ('deliveryAddress' in body) {
          const message = addressError(body.deliveryAddress);
          if (message) fail(message);
          const keys = ['recipient', 'phone', 'cep', 'street', 'number', 'complement', 'district', 'city', 'state', 'reference'];
          profile.deliveryAddress = Object.fromEntries(keys.map(key => [key, body.deliveryAddress[key].trim()]));
          profile.address = formatAddress(profile.deliveryAddress);
        }
        if ('photo' in body) {
          if (body.photo !== null) {
            if (typeof body.photo !== 'string') fail('Foto inválida.');
            const match = body.photo.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
            if (!match) fail('Use uma foto PNG, JPEG ou WebP.');
            const bytes = Buffer.from(match[2], 'base64');
            const valid = match[1] === 'png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' : match[1] === 'jpeg' ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff' : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
            if (!valid || bytes.length > 5 * 1024 * 1024) fail('Foto inválida ou maior que 5 MB.');
          }
          profile.photo = body.photo;
        }
        if ('cars' in body) {
          if (!Array.isArray(body.cars) || body.cars.length > 3) fail('Sua garagem comporta até 3 projetos.');
          profile.cars = body.cars.map(car => Object.fromEntries(['id', 'model', 'engine', 'year', 'color', 'power', 'tune', 'exhaust', 'ignition'].map(key => [key, field(car?.[key], key, ['id', 'model'].includes(key) ? 1 : 0, 100)])));
          if (new Set(profile.cars.map(car => car.id)).size !== profile.cars.length) fail('Projeto duplicado.');
        }
        if ('activeCarId' in body) profile.activeCarId = body.activeCarId;
        if (profile.activeCarId !== null && !profile.cars.some(car => car.id === profile.activeCarId)) fail('Projeto ativo inválido.');
        const email = 'email' in body ? emailOf(body.email) : row.email;
        try { db.prepare('UPDATE users SET email = ?, profile = ? WHERE id = ?').run(email, JSON.stringify(profile), row.id); } catch (error) { if (String(error).includes('UNIQUE')) fail('Este e-mail já está cadastrado.', 409); throw error; }
        return send({ user: { ...profile, id: row.id, email, isAdmin: isAdmin(db, row.id) } });
      }
      fail('Rota não encontrada.', 404);
    } catch (error) { send({ error: error.status ? error.message : 'Não foi possível concluir a operação.' }, error.status || 500); }
  });
  server.on('close', () => db.close());
  return server;
}
if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const port = Number(process.env.PORT || 3001);
  createApi({ database: process.env.DATABASE_PATH }).listen(port, process.env.HOST || '127.0.0.1', () => console.log(`SpeedZone API: http://${process.env.HOST || '127.0.0.1'}:${port}`));
}
