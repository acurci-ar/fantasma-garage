import assert from "node:assert/strict";
import { test } from "node:test";
import { setStubHeaders } from "./stubs/headers.mjs";
import { createFakeSupabaseClient, findCall } from "./helpers/fakeSupabase.mjs";
import { __resetRateLimitBuckets } from "../src/lib/utils/rateLimitCore.ts";

// createOrder revisa isSupabaseConfigured() (chequeo real de env vars, no
// mockeado): alcanza con setear las dos variables para salir del "modo
// demo" y entrar al flujo que habla con Supabase.
process.env.NEXT_PUBLIC_SUPABASE_URL = "https://fake-project.supabase.co";
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = "fake-anon-key";

const PRODUCT = {
  id: "9c858901-8a57-4791-81fe-4c455b099bc9",
  name: "Kit de suspensión",
  sku: "FG-001",
  price: 450000,
  sale_price: null,
  currency: "ARS",
  stock: 5,
  status: "published",
};

const CHECKOUT_INPUT = {
  fullName: "Juan Pérez",
  email: "juan@example.com",
  phone: "1122334455",
  street: "Av. Siempre Viva 742",
  city: "Buenos Aires",
  province: "Buenos Aires",
  postalCode: "1425",
  notes: "",
  items: [{ productId: PRODUCT.id, variantId: null, quantity: 2 }],
};

/**
 * Responder genérico para el happy path: sirve la lista de productos
 * pasada, y para todo lo demás (orders/order_items/products.update/
 * inventory_movements) devuelve éxito sin error. `orderId` es el id que
 * "insert().select('id').single()" en orders debe devolver.
 */
function happyPathResponder(products, orderId = "order-abc-123") {
  return (table, calls) => {
    if (table === "products" && findCall(calls, "in")) {
      return { data: products, error: null };
    }
    if (table === "products" && findCall(calls, "update")) {
      return { data: null, error: null };
    }
    if (table === "orders") {
      return { data: { id: orderId }, error: null };
    }
    if (table === "order_items") {
      return { error: null };
    }
    if (table === "inventory_movements") {
      return { error: null };
    }
    throw new Error(`responder sin caso para tabla "${table}" (calls: ${JSON.stringify(calls)})`);
  };
}

/**
 * Registra los mocks de los dos clientes Supabase que usa createOrder
 * (admin + de sesión) contra el mismo fake, e importa la action recién
 * después de registrarlos — createOrder los importa dinámicamente adentro
 * de la función, así que mock.module ya tiene que estar armado antes de
 * llamarla, no antes de importar el módulo de la action en sí.
 */
async function setupCreateOrder(t, responder, ipSuffix, authUser = null) {
  __resetRateLimitBuckets();
  // IP distinta por test para no compartir el rate limit entre tests que
  // no lo están probando a propósito.
  setStubHeaders({ "x-forwarded-for": `203.0.113.${ipSuffix}` });

  const fakeClient = createFakeSupabaseClient(responder, { authUser });
  t.mock.module("@/lib/supabase/admin", { namedExports: { createAdminClient: () => fakeClient } });
  t.mock.module("@/lib/supabase/server", { namedExports: { createClient: async () => fakeClient } });

  const { createOrder } = await import("../src/actions/checkout.ts");
  return createOrder;
}

test("createOrder crea el pedido y calcula el total server-side (nunca confía en el cliente)", async (t) => {
  const recorded = { insertedOrder: null, insertedItems: null };
  const responder = (table, calls) => {
    const insertCall = findCall(calls, "insert");
    if (table === "orders" && insertCall) recorded.insertedOrder = insertCall[1][0];
    if (table === "order_items" && insertCall) recorded.insertedItems = insertCall[1][0];
    return happyPathResponder([PRODUCT])(table, calls);
  };
  const createOrder = await setupCreateOrder(t, responder, 1);

  const result = await createOrder(CHECKOUT_INPUT);

  assert.equal(result.status, "success");
  assert.equal(result.orderId, "order-abc-123");
  // El input de checkout NO manda precio: el total tiene que salir de
  // PRODUCT.price (450000) * quantity (2), nunca de algo que mandó el form.
  assert.equal(recorded.insertedOrder.total, 900000);
  assert.equal(recorded.insertedItems[0].unit_price, 450000);
});

test("createOrder usa sale_price en vez de price cuando el producto tiene oferta", async (t) => {
  const onOffer = { ...PRODUCT, sale_price: 380000 };
  const recorded = { insertedOrder: null };
  const responder = (table, calls) => {
    const insertCall = findCall(calls, "insert");
    if (table === "orders" && insertCall) recorded.insertedOrder = insertCall[1][0];
    return happyPathResponder([onOffer])(table, calls);
  };
  const createOrder = await setupCreateOrder(t, responder, 2);

  const result = await createOrder(CHECKOUT_INPUT);

  assert.equal(result.status, "success");
  assert.equal(recorded.insertedOrder.total, 760000); // 380000 * 2
});

test("createOrder rechaza si el producto ya no existe", async (t) => {
  const createOrder = await setupCreateOrder(t, happyPathResponder([]), 3);
  const result = await createOrder(CHECKOUT_INPUT);
  assert.equal(result.status, "error");
  assert.match(result.message, /ya no está disponible/);
});

test("createOrder rechaza si el producto no está publicado", async (t) => {
  const draft = { ...PRODUCT, status: "draft" };
  const createOrder = await setupCreateOrder(t, happyPathResponder([draft]), 4);
  const result = await createOrder(CHECKOUT_INPUT);
  assert.equal(result.status, "error");
  assert.match(result.message, /ya no está disponible/);
});

test("createOrder rechaza si no hay stock suficiente", async (t) => {
  const lowStock = { ...PRODUCT, stock: 1 };
  const createOrder = await setupCreateOrder(t, happyPathResponder([lowStock]), 5);
  const result = await createOrder(CHECKOUT_INPUT); // pide 2, quedó 1
  assert.equal(result.status, "error");
  assert.match(result.message, /No hay stock suficiente/);
});

test('createOrder permite pedir un producto "a pedido" (stock 0) sin bloquear', async (t) => {
  const onDemand = { ...PRODUCT, stock: 0 };
  const movements = [];
  const responder = (table, calls) => {
    const insertCall = findCall(calls, "insert");
    if (table === "inventory_movements" && insertCall) movements.push(insertCall[1][0]);
    return happyPathResponder([onDemand])(table, calls);
  };
  const createOrder = await setupCreateOrder(t, responder, 6);

  const result = await createOrder(CHECKOUT_INPUT);

  assert.equal(result.status, "success");
  assert.equal(movements.length, 1);
  assert.equal(movements[0].quantity, 0); // a pedido: no descuenta stock real
  assert.match(movements[0].reason, /a pedido/);
});

test("createOrder corta después de 10 intentos por IP en una hora (rate limit)", async (t) => {
  const createOrder = await setupCreateOrder(t, happyPathResponder([PRODUCT]), 99);

  let lastResult;
  for (let i = 0; i < 11; i++) {
    lastResult = await createOrder(CHECKOUT_INPUT);
  }

  assert.equal(lastResult.status, "error");
  assert.match(lastResult.message, /muchos intentos/i);
});
