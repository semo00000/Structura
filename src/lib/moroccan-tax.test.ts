import test from 'node:test';
import assert from 'node:assert';
import {
  tvaFromTTC,
  htFromTTC,
  landedCost,
  unitLandedCost,
  netSalary,
  cnssEmployee,
  cnssEmployer,
  commission,
  formatDH
} from './moroccan-tax.ts';

test('tvaFromTTC', async (t) => {
  await t.test('should calculate 20% TVA correctly', () => {
    assert.strictEqual(tvaFromTTC(120, 20), 20);
  });

  await t.test('should calculate 10% TVA correctly', () => {
    assert.strictEqual(tvaFromTTC(110, 10), 10);
  });

  await t.test('should return 0 for non-positive VAT rate', () => {
    assert.strictEqual(tvaFromTTC(100, 0), 0);
    assert.strictEqual(tvaFromTTC(100, -5), 0);
  });

  await t.test('should handle rounding correctly', () => {
    assert.strictEqual(tvaFromTTC(100, 20), 16.67);
  });
});

test('htFromTTC', async (t) => {
  await t.test('should calculate HT from TTC correctly', () => {
    assert.strictEqual(htFromTTC(120, 20), 100);
    assert.strictEqual(htFromTTC(110, 10), 100);
  });

  await t.test('should handle rounding correctly', () => {
    assert.strictEqual(htFromTTC(100, 20), 83.33);
  });
});

test('landedCost', () => {
  assert.strictEqual(landedCost(1000, 100, 50, 10), 1250);
});

test('unitLandedCost', async (t) => {
  await t.test('should calculate unit landed cost correctly', () => {
    assert.strictEqual(unitLandedCost(1000, 100, 50, 10, 10), 125);
  });

  await t.test('should return 0 if quantity is 0 or negative', () => {
    assert.strictEqual(unitLandedCost(1000, 100, 50, 10, 0), 0);
    assert.strictEqual(unitLandedCost(1000, 100, 50, 10, -1), 0);
  });
});

test('netSalary', () => {
  assert.strictEqual(netSalary(10000, 1000, 500), 10052);
});

test('CNSS contributions', async (t) => {
  await t.test('should calculate cnssEmployee correctly', () => {
    assert.strictEqual(cnssEmployee(10000), 448);
  });

  await t.test('should calculate cnssEmployer correctly', () => {
    assert.strictEqual(cnssEmployer(10000), 2148);
  });
});

test('commission', async (t) => {
  await t.test('should calculate default commission correctly', () => {
    assert.strictEqual(commission(10000), 250);
  });

  await t.test('should calculate custom commission correctly', () => {
    assert.strictEqual(commission(10000, 0.05), 500);
  });
});

test('formatDH', () => {
  const formatted = formatDH(1234.56);
  // Using regex for flexibility with spaces
  assert.match(formatted, /1.234,56.DH/);
});
