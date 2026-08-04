import assert from "node:assert/strict";
import { test } from "node:test";
import { computeSuggestedPrice, skuConflictFieldErrors } from "../src/lib/utils/productPricing.ts";

test("computeSuggestedPrice calcula costo + margen + envío", () => {
  // 1000 * 1.12 + (10 * 45) * 1.5 = 1120 + 675 = 1795
  assert.equal(computeSuggestedPrice(1000, 10), 1795);
});

test("computeSuggestedPrice trata weight_kg null como 0 (sin cargo de envío)", () => {
  // 1000 * 1.12 = 1120
  assert.equal(computeSuggestedPrice(1000, null), 1120);
});

test("computeSuggestedPrice trata cost_price null como 0", () => {
  // (10 * 45) * 1.5 = 675
  assert.equal(computeSuggestedPrice(null, 10), 675);
});

test("computeSuggestedPrice devuelve 0 si ambos son null", () => {
  assert.equal(computeSuggestedPrice(null, null), 0);
});

test("computeSuggestedPrice redondea a 2 decimales", () => {
  // 33.33 * 1.12 = 37.3296 -> redondea a 37.33
  assert.equal(computeSuggestedPrice(33.33, null), 37.33);
});

test("skuConflictFieldErrors devuelve undefined si el código no es 23505", () => {
  assert.equal(skuConflictFieldErrors({ code: "23503", message: "sku violation" }), undefined);
});

test("skuConflictFieldErrors detecta conflicto de sku", () => {
  const result = skuConflictFieldErrors({ code: "23505", message: 'duplicate key value violates unique constraint "products_sku_key"' });
  assert.deepEqual(result, { sku: ["Ya existe un producto con ese SKU."] });
});

test("skuConflictFieldErrors detecta conflicto de slug", () => {
  const result = skuConflictFieldErrors({ code: "23505", message: 'duplicate key value violates unique constraint "products_slug_key"' });
  assert.deepEqual(result, { slug: ["Ya existe un producto con ese slug."] });
});

test("skuConflictFieldErrors devuelve undefined si es 23505 pero no matchea sku ni slug", () => {
  const result = skuConflictFieldErrors({ code: "23505", message: 'duplicate key value violates unique constraint "products_pkey"' });
  assert.equal(result, undefined);
});
