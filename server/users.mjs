import { randomBytes, randomUUID, scrypt } from 'node:crypto';
import { promisify } from 'node:util';
import { isAdmin } from './admin.mjs';
const derive = promisify(scrypt);
const fail = (message, status=400) => { throw Object.assign(new Error(message),{status}); };
export function setupUsers(db) {
  db.exec(`CREATE TABLE IF NOT EXISTS user_management (user_id TEXT PRIMARY KEY REFERENCES users(id), created_at TEXT, role TEXT NOT NULL DEFAULT 'customer', blocked INTEGER NOT NULL DEFAULT 0, archived INTEGER NOT NULL DEFAULT 0, reason TEXT NOT NULL DEFAULT '', revision INTEGER NOT NULL DEFAULT 1);
    CREATE TABLE IF NOT EXISTS user_audit (id TEXT PRIMARY KEY, actor_id TEXT NOT NULL, target_id TEXT NOT NULL, action TEXT NOT NULL, created_at TEXT NOT NULL);
    INSERT OR IGNORE INTO user_management(user_id) SELECT id FROM users;
    CREATE TRIGGER IF NOT EXISTS users_registered AFTER INSERT ON users BEGIN INSERT INTO user_management(user_id,created_at) VALUES (NEW.id,strftime('%Y-%m-%dT%H:%M:%fZ','now')); END;`);
}
export const userAccess = (db,id) => db.prepare('SELECT * FROM user_management WHERE user_id = ?').get(id);
export const canSupport = (db,id) => isAdmin(db,id) || userAccess(db,id)?.role === 'technician';
export const restricted = (db,id) => { const access=userAccess(db,id);return !!(access?.blocked||access?.archived); };
export function listUsers(db) {
  return db.prepare('SELECT users.id,users.email,users.profile,user_management.* FROM users JOIN user_management ON users.id=user_management.user_id').all().map(row=>{
    const profile=JSON.parse(row.profile);
    const orders=db.prepare('SELECT payload FROM orders WHERE user_id = ?').all(row.id).map(o=>JSON.parse(o.payload)).filter(o=>o.status==='delivered');
    const replies=db.prepare("SELECT COUNT(*) AS count FROM support_tickets WHERE EXISTS (SELECT 1 FROM json_each(json_extract(payload,'$.messages')) WHERE json_extract(value,'$.actorId')=?)").get(row.id).count;
    return {id:row.id,email:row.email,name:profile.name,surname:profile.surname,phone:profile.phone||'',photo:profile.photo,vehicle:profile.cars?.find(c=>c.id===profile.activeCarId)?.model||'',address:profile.address||'',role:isAdmin(db,row.id)?'admin':row.role,blocked:!!row.blocked,archived:!!row.archived,reason:row.reason,revision:row.revision,createdAt:row.created_at,orders:orders.length,spent:orders.reduce((sum,o)=>sum+o.total,0),replies};
  });
}
function fields(body) {
  const out={};
  for(const [key,min,max] of [['name',1,60],['surname',1,80],['email',3,254],['phone',0,30]]) {
    if(typeof body[key]!=='string'||body[key].trim().length<min||body[key].trim().length>max)fail('Confira nome, sobrenome, e-mail e telefone.');
    out[key]=body[key].trim();
  }
  out.email=out.email.toLowerCase();if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(out.email))fail('E-mail inválido.');
  if(!['customer','technician','admin'].includes(body.role))fail('Permissão inválida.');return out;
}
function role(db,id,value) {
  if(value==='admin')db.prepare('INSERT OR IGNORE INTO administrators VALUES (?,?)').run(id,new Date().toISOString());
  else db.prepare('DELETE FROM administrators WHERE user_id=?').run(id);
  db.prepare('UPDATE user_management SET role=? WHERE user_id=?').run(value==='admin'?'customer':value,id);
}
const audit=(db,actor,id,action)=>db.prepare('INSERT INTO user_audit VALUES (?,?,?,?,?)').run(randomUUID(),actor,id,action,new Date().toISOString());
export function userLogs(db,id) {return db.prepare('SELECT action,created_at AS createdAt,actor_id AS actorId FROM user_audit WHERE target_id=? ORDER BY created_at DESC LIMIT 100').all(id);}
export async function createUser(db,actor,body) {
  const values=fields(body);if(typeof body.password!=='string'||body.password.length<8||body.password.length>128)fail('Senha inicial: entre 8 e 128 caracteres.');
  const salt=randomBytes(16).toString('hex'),hash=(await derive(body.password,salt,64)).toString('hex');
  if(!isAdmin(db,actor)||restricted(db,actor))fail('Acesso administrativo revogado.',403);
  const id=randomUUID();db.exec('BEGIN IMMEDIATE');try {
    const {email,...profile}=values;
    db.prepare('INSERT INTO users VALUES (?,?,?,?)').run(id,email,`${salt}:${hash}`,JSON.stringify({...profile,photo:null,cars:[],activeCarId:null,address:''}));
    role(db,id,body.role);audit(db,actor,id,'Conta criada • '+body.role);db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');if(String(e).includes('UNIQUE'))fail('E-mail já cadastrado.',409);throw e;}
  return listUsers(db).find(u=>u.id===id);
}
export function updateUser(db,actor,id,body) {
  const values=fields(body);if(typeof body.blocked!=='boolean'||typeof body.archived!=='boolean'||typeof body.reason!=='string'||body.reason.length>500)fail('Estado da conta inválido.');
  if((body.blocked||body.archived)&&!body.reason.trim())fail('Informe o motivo do bloqueio ou desativação.');
  db.exec('BEGIN IMMEDIATE');try {
    const row=db.prepare('SELECT * FROM users WHERE id=?').get(id),meta=userAccess(db,id);
    if(!row||!meta)fail('Usuário não encontrado.',404);
    if(body.revision!==meta.revision)fail('Cadastro atualizado por outro administrador. Reabra a edição.',409);
    const previousRole=isAdmin(db,id)?'admin':meta.role;
    if(actor===id&&(body.blocked||body.archived||body.role!==previousRole))fail('Você não pode bloquear, desativar ou alterar a própria permissão.');
    if(previousRole==='admin'&&(body.role!=='admin'||body.blocked||body.archived)) {
      const active=db.prepare('SELECT COUNT(*) AS count FROM administrators a JOIN user_management m ON m.user_id=a.user_id WHERE m.blocked=0 AND m.archived=0').get().count;
      if(active<=1)fail('Mantenha pelo menos um administrador ativo.');
    }
    const profile={...JSON.parse(row.profile),name:values.name,surname:values.surname,phone:values.phone};
    db.prepare('UPDATE users SET email=?,profile=? WHERE id=?').run(values.email,JSON.stringify(profile),id);
    role(db,id,body.role);
    db.prepare('UPDATE user_management SET blocked=?,archived=?,reason=?,revision=revision+1 WHERE user_id=?').run(+body.blocked,+body.archived,body.reason.trim(),id);
    if(body.blocked||body.archived||body.role!==previousRole||row.email!==values.email)db.prepare('DELETE FROM sessions WHERE user_id=?').run(id);
    audit(db,actor,id,`Cadastro atualizado • ${previousRole} → ${body.role} • ${body.archived?'desativado':body.blocked?'bloqueado':'ativo'}`);
    db.exec('COMMIT');
  }catch(e){db.exec('ROLLBACK');if(String(e).includes('UNIQUE'))fail('E-mail já cadastrado.',409);throw e;}
  return listUsers(db).find(u=>u.id===id);
}
