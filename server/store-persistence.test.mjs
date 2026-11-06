import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

function setup() {
  const values = new Map();
  let fail = false;
  const storage = {
    getItem: async key => values.get(key) ?? null,
    setItem: async (key, value) => {
      if (fail) throw new Error('Storage unavailable');
      await new Promise(resolve => setTimeout(resolve, 5));
      values.set(key, value);
    },
  };
  const source = readFileSync(new URL('../src/utils/storePersistence.ts', import.meta.url), 'utf8');
  const { outputText } = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true } });
  const context = { exports: {}, require: () => storage };
  vm.runInNewContext(outputText, context);
  return { ...context.exports, values, setFailure: value => { fail = value; } };
}

test('cart and favorites survive reload and remain isolated by account', async () => {
  const store = setup();
  const state = { cart: { turbo: 2 }, favorites: ['turbo'] };
  await store.saveStore('pilot-a', state);
  assert.equal(JSON.stringify(await store.loadStore('pilot-a')), JSON.stringify(state));
  assert.equal(JSON.stringify(await store.loadStore('pilot-b')), JSON.stringify({ cart: {}, favorites: [] }));
});

test('rapid writes and immediate login restore the latest cart, including removals', async () => {
  const store = setup();
  const first = store.saveStore('pilot', { cart: { turbo: 2 }, favorites: ['turbo'] });
  const second = store.saveStore('pilot', { cart: {}, favorites: [] });
  assert.equal(JSON.stringify(await store.loadStore('pilot')), JSON.stringify({ cart: {}, favorites: [] }));
  await Promise.all([first, second]);
});

test('storage errors can be retried without poisoning subsequent writes', async () => {
  const store = setup();
  store.setFailure(true);
  await assert.rejects(store.saveStore('pilot', { cart: {}, favorites: [] }));
  store.setFailure(false);
  await store.saveStore('pilot', { cart: { turbo: 1 }, favorites: [] });
  assert.equal((await store.loadStore('pilot')).cart.turbo, 1);
});
