/**
 * Fake mínimo del query builder de Supabase para tests de Server Actions
 * (fase 2 del plan de cobertura de Tomás, ago-2026). No intenta ser un ORM
 * en miniatura: registra la cadena de métodos que se llamó (select/in/eq/
 * insert/update/...) y delega en un `responder(table, calls)` que cada test
 * define para decidir qué devolver, según qué tabla y qué operación fue.
 *
 * Es awaitable directo (implementa .then), igual que el builder real de
 * supabase-js — así el código de producción no necesita saber que está
 * hablando con un fake.
 */
export function createFakeQuery(table, responder) {
  const calls = [];
  const builder = {
    select: (...args) => {
      calls.push(["select", args]);
      return builder;
    },
    in: (...args) => {
      calls.push(["in", args]);
      return builder;
    },
    eq: (...args) => {
      calls.push(["eq", args]);
      return builder;
    },
    order: (...args) => {
      calls.push(["order", args]);
      return builder;
    },
    limit: (...args) => {
      calls.push(["limit", args]);
      return builder;
    },
    insert: (row) => {
      calls.push(["insert", [row]]);
      return builder;
    },
    update: (row) => {
      calls.push(["update", [row]]);
      return builder;
    },
    upsert: (row) => {
      calls.push(["upsert", [row]]);
      return builder;
    },
    delete: () => {
      calls.push(["delete", []]);
      return builder;
    },
    single: () => Promise.resolve(responder(table, [...calls, ["single", []]])),
    maybeSingle: () => Promise.resolve(responder(table, [...calls, ["maybeSingle", []]])),
    then: (resolve, reject) => Promise.resolve(responder(table, calls)).then(resolve, reject),
  };
  return builder;
}

/**
 * @param {(table: string, calls: Array<[string, unknown[]]>) => unknown} responder
 * @param {{ authUser?: unknown }} [opts]
 */
export function createFakeSupabaseClient(responder, opts = {}) {
  return {
    auth: { getUser: async () => ({ data: { user: opts.authUser ?? null } }) },
    from: (table) => createFakeQuery(table, responder),
  };
}

/** Azúcar para leer qué método se llamó en una cadena de calls (ej: findCall(calls, "insert")). */
export function findCall(calls, method) {
  return calls.find(([m]) => m === method);
}
