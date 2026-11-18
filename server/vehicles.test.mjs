import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import vm from 'node:vm';
import ts from 'typescript';

test('Brazilian vehicles are searchable without removing the previous catalog', () => {
  const file = new URL('../src/data/vehicles.ts', import.meta.url);
  const { outputText } = ts.transpileModule(readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, esModuleInterop: true } });
  const context = { exports: {}, require: createRequire(file) };
  vm.runInNewContext(outputText, context);
  const { vehiclePresets, searchVehiclePresets } = context.exports;
  for (const query of ['BMW', 'Honda Civic', 'Toyota', 'M3', 'Volkswagen']) {
    const results = searchVehiclePresets(query, 10000);
    const keys = results.map(car => car.brand.toLowerCase() + ' ' + car.model.toLowerCase());
    assert.equal(new Set(keys).size, results.length, query + ' must not repeat models by year');
    assert.ok(results.every(car => car.years === ''), 'Year must be entered by the owner');
  }
  const m3 = searchVehiclePresets('BMW M3', 100).find(car => car.model === 'M3');
  assert.ok(m3);
  assert.equal(m3.engine, '', 'Do not guess an engine across generations');
  assert.equal(m3.stockPower, '', 'Do not guess horsepower across generations');
  assert.equal(searchVehiclePresets('', 8).length, 0);
  assert.equal(searchVehiclePresets('BMW', 0).length, 0);
  assert.equal(searchVehiclePresets('BMW', 8).length, 8);
  assert.ok(vehiclePresets.length >= 3005);
  assert.equal(new Set(vehiclePresets.map(car => car.id)).size, vehiclePresets.length);
  for (const query of ['Hilux', 'Toyota Hilux 2020', 'HB20', 'HB20 2015', 'HB20S', 'Creta 2020', 'SW4', 'GT3', 'Fiat', 'Lamborghini']) assert.ok(searchVehiclePresets(query).length > 0, query);
});
