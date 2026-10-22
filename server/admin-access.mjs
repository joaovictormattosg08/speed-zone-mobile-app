import { DatabaseSync } from 'node:sqlite';
import { resolve } from 'node:path';
import { setupAdmin } from './admin.mjs';
const [email, action = 'grant'] = process.argv.slice(2);
if (!email || !['grant', 'revoke'].includes(action)) throw new Error('Uso: npm run admin -- email@exemplo.com [grant|revoke]');
const db = new DatabaseSync(resolve(process.env.DATABASE_PATH || 'server/data/speedzone.sqlite'));
try {
 setupAdmin(db);
 const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email.trim().toLowerCase());
 if (!user) throw new Error('Conta não encontrada. Cadastre a conta no aplicativo primeiro.');
 if (action === 'grant') db.prepare('INSERT OR IGNORE INTO administrators VALUES (?, ?)').run(user.id, new Date().toISOString());
 else db.prepare('DELETE FROM administrators WHERE user_id = ?').run(user.id);
 console.log(action === 'grant' ? 'Permissão administrativa concedida.' : 'Permissão administrativa removida.');
} finally { db.close(); }
