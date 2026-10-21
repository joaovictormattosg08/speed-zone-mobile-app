import { randomUUID } from 'node:crypto';
const fail = (message, status = 400) => { throw Object.assign(new Error(message), { status }); };
const text = (value, label, min, max) => {
  if (typeof value !== 'string' || value.trim().length < min || value.trim().length > max) fail(`${label}: informe entre ${min} e ${max} caracteres.`);
  return value.trim();
};
const requestKey = value => { if (typeof value !== 'string' || !/^[\w-]{8,100}$/.test(value)) fail('Identificador de solicitação inválido.'); return value; };
function validateAttachment(value) {
  if (value == null) return null;
  if (typeof value !== 'string') fail('Anexo inválido.');
  const match = value.match(/^data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/]+={0,2})$/);
  if (!match) fail('Anexe uma imagem PNG, JPEG ou WebP.');
  const bytes = Buffer.from(match[2], 'base64');
  const valid = match[1] === 'png' ? bytes.subarray(0, 8).toString('hex') === '89504e470d0a1a0a' : match[1] === 'jpeg' ? bytes.subarray(0, 3).toString('hex') === 'ffd8ff' : bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!valid || bytes.length > 5 * 1024 * 1024) fail('Imagem inválida ou maior que 5 MB.');
  return value;
}
export function setupSupport(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS support_tickets (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), request_key TEXT NOT NULL, updated_at TEXT NOT NULL, payload TEXT NOT NULL, UNIQUE(user_id, request_key)); CREATE INDEX IF NOT EXISTS support_user ON support_tickets(user_id, updated_at);`);
}
export function getTicket(db, userId, id) {
  const row = db.prepare('SELECT payload FROM support_tickets WHERE id = ? AND user_id = ?').get(id, userId);
  if (!row) fail('Chamado não encontrado nesta conta.', 404);
  return JSON.parse(row.payload);
}
export function listTickets(db, userId) {
  return db.prepare('SELECT payload FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC').all(userId).map(row => ({ ...JSON.parse(row.payload), attachment: null }));
}
export function createTicket(db, user, body) {
  const key = requestKey(body.requestKey);
  const existing = db.prepare('SELECT payload FROM support_tickets WHERE user_id = ? AND request_key = ?').get(user.id, key);
  if (existing) return JSON.parse(existing.payload);
  const name = text(body.name, 'Nome', 2, 140);
  const email = text(body.email, 'E-mail', 3, 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail('Informe um e-mail válido.');
  if (!['installation', 'fitment', 'order', 'warranty', 'other'].includes(body.category)) fail('Escolha uma categoria válida.');
  const description = text(body.description, 'Descrição', 20, 4000);
  const profile = JSON.parse(user.profile);
  const vehicle = body.vehicleId ? profile.cars.find(car => car.id === body.vehicleId) : null;
  if (body.vehicleId && !vehicle) fail('Escolha um veículo da sua garagem.');
  if (body.orderId && (typeof body.orderId !== 'string' || !db.prepare('SELECT id FROM orders WHERE id = ? AND user_id = ?').get(body.orderId, user.id))) fail('Pedido não encontrado nesta conta.', 404);
  const attachment = validateAttachment(body.attachment);
  const timestamp = new Date().toISOString();
  const ticket = { id: `TK-${randomUUID().slice(0, 8).toUpperCase()}`, name, email, category: body.category, description, vehicleId: vehicle?.id || null, vehicle: vehicle?.model || 'Sem veículo vinculado', orderId: body.orderId || null, attachment, hasAttachment: !!attachment, status: 'open', createdAt: timestamp, updatedAt: timestamp, messages: [] };
  db.prepare('INSERT INTO support_tickets VALUES (?, ?, ?, ?, ?)').run(ticket.id, user.id, key, timestamp, JSON.stringify(ticket));
  return ticket;
}
export function updateTicket(db, userId, id, body) {
  const ticket = getTicket(db, userId, id);
  if ('text' in body) {
    const key = requestKey(body.requestKey);
    if (ticket.messages.some(message => message.id === key)) return ticket;
    if (ticket.status === 'closed') fail('Reabra o chamado para adicionar uma mensagem.');
    if (ticket.messages.length >= 100) fail('Limite de 100 mensagens atingido para este chamado.');
    ticket.messages.push({ id: key, author: 'pilot', text: text(body.text, 'Mensagem', 1, 2000), createdAt: new Date().toISOString() });
  } else if (['open', 'closed'].includes(body.status)) ticket.status = body.status;
  else fail('Atualização inválida.');
  ticket.updatedAt = new Date().toISOString();
  db.prepare('UPDATE support_tickets SET payload = ?, updated_at = ? WHERE id = ? AND user_id = ?').run(JSON.stringify(ticket), ticket.updatedAt, id, userId);
  return ticket;
}
