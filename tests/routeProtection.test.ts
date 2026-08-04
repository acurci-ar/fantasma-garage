import assert from "node:assert/strict";
import { test } from "node:test";
import { isProtectedPath, loginRedirectParams } from "../src/lib/utils/routeProtection.ts";

test("isProtectedPath detecta /admin y subrutas", () => {
  assert.equal(isProtectedPath("/admin"), true);
  assert.equal(isProtectedPath("/admin/productos/nuevo"), true);
});

test("isProtectedPath detecta /cuenta y subrutas", () => {
  assert.equal(isProtectedPath("/cuenta"), true);
  assert.equal(isProtectedPath("/cuenta/pedidos/123"), true);
});

test("isProtectedPath detecta /checkout", () => {
  assert.equal(isProtectedPath("/checkout"), true);
});

test("isProtectedPath no marca rutas públicas como protegidas", () => {
  assert.equal(isProtectedPath("/"), false);
  assert.equal(isProtectedPath("/tienda"), false);
  assert.equal(isProtectedPath("/login"), false);
  assert.equal(isProtectedPath("/contacto"), false);
});

test("isProtectedPath no matchea por substring en medio del path (solo prefijo)", () => {
  // Regression: startsWith es correcto acá, pero lo dejamos explícito para
  // que un futuro cambio a .includes() (que rompería esto) falle un test.
  assert.equal(isProtectedPath("/no-es-cuenta"), false);
  assert.equal(isProtectedPath("/tienda/admin-tools"), false);
});

test("loginRedirectParams agrega redirect=/checkout solo para /checkout", () => {
  assert.deepEqual(loginRedirectParams("/checkout"), { redirect: "/checkout" });
});

test("loginRedirectParams no agrega nada para /admin ni /cuenta", () => {
  assert.deepEqual(loginRedirectParams("/admin"), {});
  assert.deepEqual(loginRedirectParams("/cuenta/pedidos/123"), {});
});
