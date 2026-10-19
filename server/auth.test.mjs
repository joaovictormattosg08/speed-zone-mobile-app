import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, rm, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createApi } from './index.mjs';

test('accounts, sessions, profile isolation and persistence', async () => {
  const directory = await mkdtemp(join(tmpdir(), 'speedzone-auth-'));
  const database = join(directory, 'test.sqlite');
  let server = createApi({ database });
  const listen = () => new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const close = () => new Promise(resolve => server.close(resolve));
  await listen();
  async function call(path, method = 'GET', body, token, origin) {
    const response = await fetch(`http://127.0.0.1:${server.address().port}${path}`, { method, headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(origin ? { Origin: origin } : {}) }, body: body ? JSON.stringify(body) : undefined });
    return { status: response.status, data: await response.json(), cookie: response.headers.get('set-cookie') };
  }
  try {
    const account = { name: 'Ana', surname: 'Piloto', email: 'ana@example.com', password: 'SenhaDeTeste123!', remember: true };
    assert.equal((await call('/me')).status, 401);
    assert.equal((await call('/auth/register', 'POST', { ...account, password: 'short' })).status, 400);
    const registered = await call('/auth/register', 'POST', account);
    assert.equal(registered.status, 201);
    assert.ok(registered.cookie.includes('HttpOnly')); assert.ok(registered.cookie.includes('Max-Age='));
    assert.equal(registered.data.user.password, undefined);
    const token = registered.data.token;
    assert.equal((await call('/auth/register', 'POST', account)).status, 409);
    assert.equal((await call('/auth/login', 'POST', { ...account, password: 'WrongPassword' })).status, 401);
    const other = await call('/auth/register', 'POST', { ...account, email: 'other@example.com', remember: false }, undefined, 'http://localhost:8081');
    assert.equal(other.status, 201); assert.equal(other.data.token, undefined); assert.ok(!other.cookie.includes('Max-Age'));
    assert.equal((await call('/me', 'PATCH', { name: 'Intruder' }, token, 'https://evil.example')).status, 403);
    assert.equal((await call('/me', 'PATCH', { email: 'other@example.com' }, token)).status, 409);
    assert.equal((await call('/me', 'PATCH', { photo: 'data:image/png;base64,aGVsbG8=' }, token)).status, 400);
    const photo = `data:image/png;base64,${(await readFile(new URL('../assets/icon.png', import.meta.url))).toString('base64')}`;
    const car = { id: 'car-1', model: 'Golf GTI', engine: '2.0 TSI', year: '2019', color: 'Preto', power: '318', tune: 'Stage 2+', exhaust: 'Downpipe', ignition: 'R8' };
    const updated = await call('/me', 'PATCH', { name: 'Ana Maria', phone: '11987654321', photo, cars: [car], activeCarId: car.id, address: 'Rua Teste, 10' }, token);
    assert.equal(updated.status, 200); assert.equal(updated.data.user.photo, photo);
    assert.equal((await call('/me', 'PATCH', { cars: Array(4).fill(car) }, token)).status, 400);
    const otherLogin = await call('/auth/login', 'POST', { ...account, email: 'other@example.com' });
    const otherProfile = await call('/me', 'GET', undefined, otherLogin.data.token);
    assert.equal(otherProfile.data.user.photo, null); assert.equal(otherProfile.data.user.cars.length, 0);
    const purchase = { requestKey: 'checkout-test-123', delivery: { cep: '01310100', service: 'express' }, items: [{ id: 'SZ-TUR-042', quantity: 1 }, { id: 'SZ-ELT-220', quantity: 1 }, { id: 'SZ-ACC-015', quantity: 2 }], coupon: 'PROJETO10', total: 1 };
    assert.equal((await call('/orders', 'POST', purchase)).status, 401);
    const placed = await call('/orders', 'POST', purchase, token);
    assert.equal(placed.data.order.delivery.price, 8500); assert.equal(placed.data.order.delivery.cep, '01310100');
    assert.equal(placed.status, 201); assert.equal(placed.data.order.total, 543010); assert.equal(placed.data.order.demo, true);
    assert.equal((await call('/orders', 'POST', purchase, token)).data.order.id, placed.data.order.id);
    assert.equal((await call('/orders', 'GET', undefined, token)).data.orders.length, 1);
    assert.equal((await call('/orders', 'GET', undefined, otherLogin.data.token)).data.orders.length, 0);
    assert.equal((await call('/orders', 'POST', { ...purchase, requestKey: 'invalid-quantity', items: [{ id: 'SZ-TUR-042', quantity: -1 }] }, token)).status, 400);
    assert.equal((await call('/orders', 'POST', { ...purchase, requestKey: 'invalid-coupon', coupon: 'TURBO50' }, token)).status, 400);
    assert.equal((await call('/orders', 'POST', { ...purchase, requestKey: 'missing-delivery', delivery: null }, token)).status, 400);
    assert.equal((await call('/orders', 'POST', { ...purchase, requestKey: 'invalid-cep', delivery: { cep: '00000000', service: 'express' } }, token)).status, 400);
    const economy = await call('/orders', 'POST', { ...purchase, requestKey: 'economy-delivery', delivery: { cep: '01310100', service: 'standard', price: 1 } }, token);
    assert.equal(economy.data.order.shipping, 3990); assert.equal(economy.data.order.total, 538500);
    const free = await call('/orders', 'POST', { ...purchase, requestKey: 'free-delivery', items: [{ id: 'SZ-TUR-660-TS', quantity: 1 }] }, token);
    assert.equal(free.data.order.shipping, 0);
    await close(); server = createApi({ database }); await listen();
    assert.equal((await call('/orders', 'GET', undefined, token)).data.orders.some(order => order.id === placed.data.order.id), true);
    const restored = await call('/me', 'GET', undefined, token);
    assert.equal(restored.data.user.name, 'Ana Maria'); assert.equal(restored.data.user.cars[0].model, 'Golf GTI'); assert.equal(restored.data.user.photo, photo);
    assert.equal((await call('/auth/logout', 'POST', {}, token)).status, 200);
    assert.equal((await call('/me', 'GET', undefined, token)).status, 401);
    const login = await call('/auth/login', 'POST', account); assert.equal(login.status, 200);
    assert.equal((await call('/me', 'PATCH', { photo: null }, login.data.token)).data.user.photo, null);
  } finally { await close(); await rm(directory, { recursive: true, force: true }); }
});
