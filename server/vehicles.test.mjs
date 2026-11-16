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
  assert.ok(vehiclePresets.length >= 3005);
  assert.equal(new Set(vehiclePresets.map(car => car.id)).size, vehiclePresets.length);
  for (const query of ['Hilux', 'Toyota Hilux 2020', 'HB20', 'HB20 2015', 'HB20S', 'Creta 2020', 'SW4', 'GT3', 'Fiat', 'Lamborghini']) assert.ok(searchVehiclePresets(query).length > 0, query);
});
