import assert from "node:assert/strict";
import { test } from "node:test";
import { setStubHeaders } from "./stubs/headers.mjs";
import { createFakeSupabaseClient, findCall } from "./helpers/fakeSupabase.mjs";
import { __resetRateLimitBuckets } from "../src/lib/utils/rateLimitCore.ts";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";

function buildForm(email, interests = []) {
  const fd = new FormData();
  fd.set("email", email);
  for (const interest of interests) fd.append("interests", interest);
  return fd;
}

async function setupSubscribeNewsletter(t, ipSuffix, { activeInterests = [] } = {}) {
  __resetRateLimitBuckets();
  setStubHeaders({ "x-forwarded-for": `198.51.100.${ipSuffix}` });

  const upserted = [];
  const fakeClient = createFakeSupabaseClient((table, calls) => {
    if (table === "newsletter_interests" && findCall(calls, "in")) {
      // .in("slug", [...interests]) -> calls guarda ["in", ["slug", [...interests]]];
      // el segundo elemento de args (índice 1) es el array de valores pedidos.
      const [, inArgs] = findCall(calls, "in");
      const requested = inArgs[1];
      return { data: activeInterests.filter((slug) => requested.includes(slug)).map((slug) => ({ slug })) };
    }
    const upsertCall = findCall(calls, "upsert");
    if (table === "newsletter_subscribers" && upsertCall) {
      upserted.push(upsertCall[1][0]);
      return { error: null };
    }
    throw new Error(`responder sin caso para tabla "${table}" (calls: ${JSON.stringify(calls)})`);
  });

  t.mock.module("@/lib/supabase/server", { namedExports: { createClient: async () => fakeClient } });

  const { subscribeNewsletter } = await import("../src/actions/newsletter.ts");
  return { subscribeNewsletter, upserted };
}

test("subscribeNewsletter suscribe con un email válido y sin intereses", async (t) => {
  const { subscribeNewsletter, upserted } = await setupSubscribeNewsletter(t, 1);

  const result = await subscribeNewsletter({ status: "idle", message: "" }, buildForm("cliente@example.com"));

  assert.equal(result.status, "success");
  assert.equal(upserted.length, 1);
  assert.equal(upserted[0].email, "cliente@example.com");
  assert.deepEqual(upserted[0].interests, []);
});

test("subscribeNewsletter filtra intereses que ya no están activos", async (t) => {
  const { subscribeNewsletter, upserted } = await setupSubscribeNewsletter(t, 2, {
    activeInterests: ["restauracion"],
  });

  const result = await subscribeNewsletter(
    { status: "idle", message: "" },
    buildForm("cliente@example.com", ["restauracion", "un-tag-viejo-desactivado"])
  );

  assert.equal(result.status, "success");
  assert.deepEqual(upserted[0].interests, ["restauracion"]);
});

test("subscribeNewsletter rechaza un email inválido sin llegar a Supabase", async (t) => {
  const { subscribeNewsletter, upserted } = await setupSubscribeNewsletter(t, 3);

  const result = await subscribeNewsletter({ status: "idle", message: "" }, buildForm("no-es-un-email"));

  assert.equal(result.status, "error");
  assert.equal(upserted.length, 0);
});

test("subscribeNewsletter corta después de 5 intentos por IP en 10 minutos", async (t) => {
  const { subscribeNewsletter, upserted } = await setupSubscribeNewsletter(t, 4);

  let lastResult;
  for (let i = 0; i < 6; i++) {
    lastResult = await subscribeNewsletter({ status: "idle", message: "" }, buildForm(`cliente${i}@example.com`));
  }

  assert.equal(lastResult.status, "error");
  assert.match(lastResult.message, /demasiados intentos/i);
  assert.equal(upserted.length, 5);
});
