import assert from "node:assert/strict";
import { test } from "node:test";
import {
  formatBytes,
  isImageTooHeavy,
  exceedsHardLimit,
  SUGGESTED_MAX_IMAGE_BYTES,
  MAX_PRODUCT_IMAGE_BYTES,
} from "../src/lib/utils/image.ts";

test("formatBytes muestra B, KB o MB según corresponda", () => {
  assert.equal(formatBytes(500), "500 B");
  assert.equal(formatBytes(2048), "2 KB");
  assert.equal(formatBytes(5 * 1024 * 1024), "5.0 MB");
});

test("isImageTooHeavy es false para una imagen liviana y chica", () => {
  assert.equal(isImageTooHeavy(100 * 1024, 800, 800), false);
});

test("isImageTooHeavy es true si pesa más del umbral aunque sea chica", () => {
  assert.equal(isImageTooHeavy(SUGGESTED_MAX_IMAGE_BYTES + 1, 500, 500), true);
});

test("isImageTooHeavy es true si las dimensiones son muy grandes aunque pese poco", () => {
  assert.equal(isImageTooHeavy(50 * 1024, 4000, 3000), true);
});

test("isImageTooHeavy no rompe si no se conocen las dimensiones", () => {
  assert.equal(isImageTooHeavy(50 * 1024), false);
});

test("exceedsHardLimit rechaza archivos por encima del límite duro", () => {
  assert.equal(exceedsHardLimit(MAX_PRODUCT_IMAGE_BYTES + 1), true);
  assert.equal(exceedsHardLimit(MAX_PRODUCT_IMAGE_BYTES), false);
});
