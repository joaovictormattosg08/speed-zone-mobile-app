import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApi } from './index.mjs';

test('inventory permissions, persistence, publication, stock and checkout', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'sz-products-'));
  const database = join(directory, 'test.sqlite');
  let server = createApi({ database });
  const listen = () => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const close = () => new Promise(resolve => server.close(resolve));
  await listen();
  const call = async (path, method = 'GET', body, token) => {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { 'Content-Type':'application/json', ...(token ? { Authorization:`Bearer ${token}` } : {}) }, ...(body ? {body:JSON.stringify(body)} : {}) });
    return { status:response.status, ...(await response.json()) };
  };
  try {
    const user = await call('/auth/register','POST',{name:'Admin',surname:'Teste',email:'inventory@example.com',password:'TestPassword123!'});
    const token = user.token;
    assert.equal((await call('/admin/products')).status,401);
    assert.equal((await call('/admin/products','POST',{},token)).status,403);
    const db = new DatabaseSync(database);
    db.prepare('INSERT INTO administrators VALUES (?, ?)').run(user.user.id,new Date().toISOString()); db.close();
    const images = ['data:image/png;base64,' + (await readFile(new URL('../assets/icon.png',import.meta.url))).toString('base64')];
    const draft = {id:'SZ-NEW-001',name:'Peça de teste',price:123.45,cost:50,stock:2,minimum:1,category:'Turbo',subcategory:'Turbinas',stage:'STAGE 3',power:'350 CV',diameter:'54mm',material:'Billet',description:'Descrição de teste',images,platforms:['EA888'],published:false};
    const created = await call('/admin/products','POST',draft,token);
    assert.equal(created.status,201);
    assert.equal((await call('/admin/products','POST',draft,token)).status,409);
    assert.ok(!(await call('/products')).products.some(p=>p.id===draft.id));
    const path = '/admin/products/'+draft.id;
    assert.equal((await call(path,'PATCH',{...created.product,stock:-1},token)).status,400);
    const published = await call(path,'PATCH',{...created.product,published:true},token);
    assert.equal(published.status,200);
    assert.equal((await call(path,'PATCH',created.product,token)).status,409);
    const publicProduct = (await call('/products')).products.find(p=>p.id===draft.id);
    assert.equal(publicProduct.price,123.45); assert.equal(publicProduct.cost,undefined);
    const purchase = {items:[{id:draft.id,quantity:2}],requestKey:'inventory-order-1',delivery:{cep:'01310100',service:'standard'}};
    const order = await call('/orders','POST',purchase,token);
    assert.equal(order.status,201); assert.equal(order.order.subtotal,24690);
    assert.equal((await call('/orders','POST',purchase,token)).order.id,order.order.id);
    assert.equal((await call('/products')).products.find(p=>p.id===draft.id).stock,0);
    assert.equal((await call('/orders','POST',{...purchase,requestKey:'inventory-order-2'},token)).status,400);
    await call('/admin/orders/'+order.order.id,'PATCH',{expectedStatus:'processing',status:'cancelled'},token);
    await call('/admin/orders/'+order.order.id,'PATCH',{expectedStatus:'processing',status:'cancelled'},token);
    assert.equal((await call('/products')).products.find(p=>p.id===draft.id).stock,2);
    await close(); server = createApi({database}); await listen();
    const persisted = (await call('/admin/products','GET',undefined,token)).products.find(p=>p.id===draft.id);
    assert.deepEqual(persisted.images,images);
    assert.equal((await call(path,'PATCH',{revision:persisted.revision,archived:true},token)).status,200);
    assert.ok(!(await call('/products')).products.some(p=>p.id===draft.id));
    assert.equal((await call('/orders','GET',undefined,token)).orders[0].items[0].name,draft.name);
  } finally { await close(); await rm(directory,{recursive:true,force:true}); }
});
