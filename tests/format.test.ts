import assert from "node:assert/strict";
import { test } from "node:test";
import { formatCurrency, slugify } from "../src/lib/utils/format.ts";
import { extractYouTubeVideoId } from "../src/lib/utils/youtube.ts";

test("formatCurrency formatea en ARS sin decimales", () => {
  const result = formatCurrency(450000, "ARS");
  assert.match(result, /450.000|450,000/); // separador según entorno del runner
  assert.match(result, /\$/);
});

test("formatCurrency formatea en USD", () => {
  const result = formatCurrency(100, "USD");
  assert.match(result, /US\$|USD|\$/);
});

test("slugify normaliza acentos y espacios", () => {
  assert.equal(slugify("Chapa y Pintura"), "chapa-y-pintura");
  assert.equal(slugify("Reparación Integral"), "reparacion-integral");
  assert.equal(slugify("  Espacios   Multiples  "), "espacios-multiples");
});

test("slugify recorta guiones al inicio/fin", () => {
  assert.equal(slugify("-- Motor V8 --"), "motor-v8");
});

test("extractYouTubeVideoId soporta watch?v=", () => {
  assert.equal(
    extractYouTubeVideoId("https://www.youtube.com/watch?v=dQw4w9WgXcQ"),
    "dQw4w9WgXcQ"
  );
});

test("extractYouTubeVideoId soporta youtu.be", () => {
  assert.equal(extractYouTubeVideoId("https://youtu.be/dQw4w9WgXcQ"), "dQw4w9WgXcQ");
});

test("extractYouTubeVideoId devuelve null para canal o playlist", () => {
  assert.equal(extractYouTubeVideoId("https://www.youtube.com/@ChevyFantasma"), null);
  assert.equal(
    extractYouTubeVideoId("https://www.youtube.com/playlist?list=PL-abc123"),
    null
  );
});
