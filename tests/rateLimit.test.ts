import assert from "node:assert/strict";
import { test } from "node:test";
import { checkRateLimit, __resetRateLimitBuckets } from "../src/lib/utils/rateLimitCore.ts";

test("checkRateLimit permite hasta el límite configurado", () => {
  __resetRateLimitBuckets();
  const key = "test:allow";
  assert.equal(checkRateLimit(key, 3, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 3, 60_000).allowed, true);
  assert.equal(checkRateLimit(key, 3, 60_000).allowed, true);
});

test("checkRateLimit bloquea al superar el límite y devuelve retryAfterSeconds > 0", () => {
  __resetRateLimitBuckets();
  const key = "test:block";
  checkRateLimit(key, 2, 60_000);
  checkRateLimit(key, 2, 60_000);
  const blocked = checkRateLimit(key, 2, 60_000);
  assert.equal(blocked.allowed, false);
  assert.ok(blocked.retryAfterSeconds > 0);
});

test("checkRateLimit trackea cada key de forma independiente", () => {
  __resetRateLimitBuckets();
  checkRateLimit("test:ip-a", 1, 60_000);
  const blockedA = checkRateLimit("test:ip-a", 1, 60_000);
  const allowedB = checkRateLimit("test:ip-b", 1, 60_000);
  assert.equal(blockedA.allowed, false);
  assert.equal(allowedB.allowed, true);
});

test("checkRateLimit resetea el conteo una vez que pasa la ventana", async () => {
  __resetRateLimitBuckets();
  const key = "test:window";
  const windowMs = 50;
  checkRateLimit(key, 1, windowMs);
  const blocked = checkRateLimit(key, 1, windowMs);
  assert.equal(blocked.allowed, false);

  await new Promise((resolve) => setTimeout(resolve, windowMs + 20));

  const allowedAfterWindow = checkRateLimit(key, 1, windowMs);
  assert.equal(allowedAfterWindow.allowed, true);
});
