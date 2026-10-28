const fail=(message,status=400)=>{throw Object.assign(new Error(message),{status});};
export function setupCoupons(db){
 db.exec(`CREATE TABLE IF NOT EXISTS promotional_coupons(code TEXT PRIMARY KEY,payload TEXT NOT NULL);
 CREATE TABLE IF NOT EXISTS promotional_uses(code TEXT NOT NULL,user_id TEXT NOT NULL,order_id TEXT NOT NULL UNIQUE,savings INTEGER NOT NULL,PRIMARY KEY(code,user_id));`);
 const seeds=[{code:'PROJETO10',label:'Pista oficial',kind:'percent',value:10,minimum:0,limit:300},{code:'GARAGEPASS',label:'GaragePass',kind:'percent',value:15,minimum:700000,limit:50},{code:'TURBO50',label:'Track Day',kind:'shipping',value:50,minimum:0,limit:500,expires:'2024-12-31'}];
 for(const seed of seeds)db.prepare('INSERT OR IGNORE INTO promotional_coupons VALUES (?,?)').run(seed.code,JSON.stringify({expires:'',paused:false,archived:false,ownerId:null,ownerEmail:'',revision:1,...seed}));
 // Import past uses without changing old order totals.
 for(const row of db.prepare('SELECT user_id,payload FROM orders').all()){const order=JSON.parse(row.payload);if(seeds.some(c=>c.code===order.coupon))db.prepare('INSERT OR IGNORE INTO promotional_uses VALUES (?,?,?,?)').run(order.coupon,row.user_id,order.id,order.discount);}
}
function view(db,p){const usage=db.prepare('SELECT COUNT(*) AS used,COALESCE(SUM(savings),0) AS savings FROM promotional_uses WHERE code=?').get(p.code);const state=p.archived?'archived':p.paused?'paused':p.expires&&Date.now()>Date.parse(p.expires+'T23:59:59.999-03:00')?'expired':p.limit>0&&usage.used>=p.limit?'exhausted':'active';return {...p,...usage,state};}
export const listCoupons=db=>db.prepare('SELECT payload FROM promotional_coupons ORDER BY code').all().map(r=>view(db,JSON.parse(r.payload)));
export function saveCoupon(db,body,code){
 const row=code&&db.prepare('SELECT payload FROM promotional_coupons WHERE code=?').get(code);if(code&&!row)fail('Cupom não encontrado.',404);const old=row?JSON.parse(row.payload):null;
 if(old&&body.revision!==old.revision)fail('O cupom foi atualizado. Reabra suas regras.',409);
 const next={code:code||body.code,revision:(old?.revision||0)+1};
 if(typeof next.code!=='string'||!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(next.code)||next.code.startsWith('SP-'))fail('Use um código de 3 a 40 letras, números e hífens, sem o prefixo SP-.');
 if(typeof body.label!=='string'||body.label.trim().length<2||body.label.length>100)fail('Informe o nome da campanha.');
 if(!['percent','fixed','shipping'].includes(body.kind))fail('Tipo de desconto inválido.');
 if(!Number.isInteger(body.value)||body.value<=0||body.value>(body.kind==='fixed'?10000000:100))fail('Desconto inválido. Percentuais devem estar entre 1 e 100.');
 if(!Number.isInteger(body.minimum)||body.minimum<0||body.minimum>100000000||!Number.isInteger(body.limit)||body.limit<0||body.limit>1000000)fail('Confira o pedido mínimo e a quantidade de usos.');
 if(typeof body.expires!=='string'||(body.expires&&(!/^\d{4}-\d{2}-\d{2}$/.test(body.expires)||!Number.isFinite(Date.parse(body.expires))||new Date(body.expires).toISOString().slice(0,10)!==body.expires)))fail('Use uma data válida no formato AAAA-MM-DD.');
 if(typeof body.paused!=='boolean'||typeof body.archived!=='boolean'||typeof body.ownerEmail!=='string')fail('Configuração inválida.');
 const maximum=body.maximum??old?.maximum??0, categories=body.categories??old?.categories??[];
 if(!Number.isInteger(maximum)||maximum<0||maximum>100000000)fail('Teto de desconto inválido.');
 if(!Array.isArray(categories)||categories.length>30||categories.some(c=>typeof c!=='string'||!c.trim()||c.length>200))fail('Categorias inválidas.');
 const email=body.ownerEmail.trim().toLowerCase();const owner=email?db.prepare('SELECT id FROM users WHERE email=?').get(email):null;if(email&&!owner)fail('A conta exclusiva precisa estar cadastrada.');
 if(old&&view(db,old).used>0&&old.ownerId!==(owner?.id||null))fail('Um cupom utilizado não pode trocar de conta exclusiva.');
 Object.assign(next,{maximum,categories:[...new Set(categories)],label:body.label.trim(),kind:body.kind,value:body.value,minimum:body.minimum,limit:body.limit,expires:body.expires,paused:body.paused,archived:body.archived,ownerId:owner?.id||null,ownerEmail:email});
 try{if(old)db.prepare('UPDATE promotional_coupons SET payload=? WHERE code=?').run(JSON.stringify(next),code);else db.prepare('INSERT INTO promotional_coupons VALUES (?,?)').run(next.code,JSON.stringify(next));}catch(e){if(String(e).includes('UNIQUE'))fail('Código já cadastrado.',409);throw e;}
 return view(db,next);
}
export function customerCoupons(db,userId){return listCoupons(db).filter(p=>!p.archived&&(!p.ownerId||p.ownerId===userId)).map(p=>{
 const use=db.prepare('SELECT order_id FROM promotional_uses WHERE code=? AND user_id=?').get(p.code,userId);
 return {maximum:p.maximum||0,categories:p.categories||[],code:p.code,label:p.kind==='fixed'?`R$ ${(p.value/100).toFixed(2)} OFF`:p.kind==='shipping'?`${p.value}% OFF no frete`:`${p.value}% OFF`,percent:p.kind==='percent'?p.value:0,fixedCents:p.kind==='fixed'?p.value:0,shippingPercent:p.kind==='shipping'?p.value:0,freeShipping:false,minimum:p.minimum,usedOrder:use?.order_id||null,unavailableReason:p.state==='active'?null:p.state==='paused'?'Cupom pausado.':p.state==='expired'?'Cupom expirado.':'Limite de usos atingido.'};
 });}
export function resolveCoupon(db,userId,code){if(!code||code.startsWith('SP-'))return null;const coupon=customerCoupons(db,userId).find(p=>p.code===code);if(!coupon)fail('Cupom não encontrado ou não disponível para sua conta.');return coupon;}
export function consumePromotion(db,userId,code,order){const coupon=resolveCoupon(db,userId,code);if(coupon.usedOrder||coupon.unavailableReason)fail(coupon.unavailableReason||'Este cupom já foi usado nesta conta.');if(order.subtotal<coupon.minimum)fail('Pedido abaixo do mínimo do cupom.');db.prepare('INSERT INTO promotional_uses VALUES (?,?,?,?)').run(code,userId,order.id,order.discount+Math.max(0,(order.delivery?.price||0)-order.shipping));}
