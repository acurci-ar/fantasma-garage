import assert from "node:assert/strict";
import { test } from "node:test";
import { sanitizeRedirect } from "../src/lib/utils/redirect.ts";

test("sanitizeRedirect acepta un path relativo interno", () => {
  assert.equal(sanitizeRedirect("/checkout"), "/checkout");
});

test("sanitizeRedirect acepta un path con query string", () => {
  assert.equal(sanitizeRedirect("/cuenta/pedidos/123?tab=envio"), "/cuenta/pedidos/123?tab=envio");
});

test("sanitizeRedirect usa el fallback si el valor es undefined", () => {
  assert.equal(sanitizeRedirect(undefined), "/cuenta");
});

test("sanitizeRedirect usa un fallback custom si se pasa", () => {
  assert.equal(sanitizeRedirect(undefined, "/login"), "/login");
});

test("sanitizeRedirect rechaza un protocolo-relative URL (//evil.com)", () => {
  assert.equal(sanitizeRedirect("//evil.com"), "/cuenta");
});

test("sanitizeRedirect rechaza una URL absoluta con esquema", () => {
  assert.equal(sanitizeRedirect("https://evil.com/phishing"), "/cuenta");
  assert.equal(sanitizeRedirect("javascript://alert(1)"), "/cuenta");
});

test("sanitizeRedirect rechaza un path que no empieza con /", () => {
  assert.equal(sanitizeRedirect("evil.com"), "/cuenta");
});

test("sanitizeRedirect rechaza string vacío", () => {
  assert.equal(sanitizeRedirect(""), "/cuenta");
});

test("sanitizeRedirect toma el primer valor si viene como array (searchParams repetido)", () => {
  assert.equal(sanitizeRedirect(["/checkout", "/admin"]), "/checkout");
});

test("sanitizeRedirect aplica el fallback si el primer valor del array es inválido", () => {
  assert.equal(sanitizeRedirect(["//evil.com", "/checkout"]), "/cuenta");
});
