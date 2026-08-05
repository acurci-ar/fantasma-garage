import assert from "node:assert/strict";
import { test } from "node:test";
import { setStubHeaders } from "./stubs/headers.mjs";
import { getClientIp } from "../src/lib/utils/rateLimit.ts";

test("getClientIp toma x-forwarded-for cuando hay una sola IP", () => {
  setStubHeaders({ "x-forwarded-for": "203.0.113.7" });
  assert.equal(getClientIp(), "203.0.113.7");
});

test("getClientIp toma la primera IP de una cadena de proxies", () => {
  // x-forwarded-for: cliente, proxy1, proxy2, ... — la primera es la del
  // cliente original, el resto son los proxies que reenviaron la request.
  setStubHeaders({ "x-forwarded-for": "203.0.113.7, 10.0.0.1, 10.0.0.2" });
  assert.equal(getClientIp(), "203.0.113.7");
});

test("getClientIp recorta espacios alrededor de la primera IP", () => {
  setStubHeaders({ "x-forwarded-for": "  203.0.113.7  ,10.0.0.1" });
  assert.equal(getClientIp(), "203.0.113.7");
});

test("getClientIp usa x-real-ip si no hay x-forwarded-for", () => {
  setStubHeaders({ "x-real-ip": "198.51.100.9" });
  assert.equal(getClientIp(), "198.51.100.9");
});

test("getClientIp prefiere x-forwarded-for por sobre x-real-ip si ambos están", () => {
  setStubHeaders({ "x-forwarded-for": "203.0.113.7", "x-real-ip": "198.51.100.9" });
  assert.equal(getClientIp(), "203.0.113.7");
});

test('getClientIp devuelve "unknown" si no hay ningún header', () => {
  setStubHeaders({});
  assert.equal(getClientIp(), "unknown");
});
