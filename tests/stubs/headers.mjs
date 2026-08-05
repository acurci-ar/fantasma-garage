// Stub de next/headers para tests fuera del runtime de Next. La key real
// (x-forwarded-for) se setea con setStubHeaders() desde el test antes de
// llamar a la action.
let current = new Map();

export function headers() {
  return { get: (name) => current.get(name.toLowerCase()) ?? null };
}

export function cookies() {
  return { get: () => undefined, set: () => {}, delete: () => {} };
}

export function setStubHeaders(obj) {
  current = new Map(Object.entries(obj).map(([k, v]) => [k.toLowerCase(), v]));
}
