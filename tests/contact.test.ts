import assert from "node:assert/strict";
import { test } from "node:test";
import { setStubHeaders } from "./stubs/headers.mjs";
import { createFakeSupabaseClient, findCall } from "./helpers/fakeSupabase.mjs";
import { __resetRateLimitBuckets } from "../src/lib/utils/rateLimitCore.ts";

process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";

function buildForm(overrides = {}) {
  const fd = new FormData();
  const values = {
    name: "Juan Pérez",
    email: "juan@example.com",
    phone: "",
    subject: "Consulta",
    message: "Quiero saber el estado de mi Camaro.",
    company: "", // honeypot: vacío = humano
    ...overrides,
  };
  for (const [key, value] of Object.entries(values)) fd.set(key, value);
  return fd;
}

async function setupSubmitContactForm(t, ipSuffix) {
  __resetRateLimitBuckets();
  setStubHeaders({ "x-forwarded-for": `198.51.100.${ipSuffix}` });

  const inserted = [];
  const fakeClient = createFakeSupabaseClient((table, calls) => {
    const insertCall = findCall(calls, "insert");
    if (table === "contact_messages" && insertCall) {
      inserted.push(insertCall[1][0]);
      return { error: null };
    }
    throw new Error(`responder sin caso para tabla "${table}"`);
  });

  t.mock.module("@/lib/supabase/server", { namedExports: { createClient: async () => fakeClient } });

  const { submitContactForm } = await import("../src/actions/contact.ts");
  return { submitContactForm, inserted };
}

test("submitContactForm inserta el mensaje con datos válidos", async (t) => {
  const { submitContactForm, inserted } = await setupSubmitContactForm(t, 1);

  const result = await submitContactForm({ status: "idle", message: "" }, buildForm());

  assert.equal(result.status, "success");
  assert.equal(inserted.length, 1);
  assert.equal(inserted[0].email, "juan@example.com");
  assert.equal(inserted[0].status, "nuevo");
});

test("submitContactForm no persiste si el honeypot viene completo (bot)", async (t) => {
  const { submitContactForm, inserted } = await setupSubmitContactForm(t, 2);

  const result = await submitContactForm({ status: "idle", message: "" }, buildForm({ company: "Acme Inc" }));

  // Responde éxito igual (no delata al bot que lo detectamos), pero sin insertar nada.
  assert.equal(result.status, "success");
  assert.equal(inserted.length, 0);
});

test("submitContactForm rechaza datos inválidos antes de tocar Supabase", async (t) => {
  const { submitContactForm, inserted } = await setupSubmitContactForm(t, 3);

  const result = await submitContactForm({ status: "idle", message: "" }, buildForm({ email: "no-es-un-email" }));

  assert.equal(result.status, "error");
  assert.ok(result.fieldErrors?.email);
  assert.equal(inserted.length, 0);
});

test("submitContactForm corta después de 5 envíos por IP en 10 minutos", async (t) => {
  const { submitContactForm, inserted } = await setupSubmitContactForm(t, 4);

  let lastResult;
  for (let i = 0; i < 6; i++) {
    lastResult = await submitContactForm({ status: "idle", message: "" }, buildForm());
  }

  assert.equal(lastResult.status, "error");
  assert.match(lastResult.message, /varios mensajes/i);
  assert.equal(inserted.length, 5); // los primeros 5 sí entraron, el 6to no
});
