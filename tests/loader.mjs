// Loader mínimo solo para tests (fase 2 del plan de cobertura de Tomás):
// - mapea @/... a src/... (tsconfig "paths", que node --test no entiende
//   de por sí — solo webpack/tsc lo resuelven).
// - si un import relativo no trae extensión (moduleResolution: "bundler"
//   en tsconfig lo permite, ESM nativo de Node no), reintenta agregando
//   ".ts".
// - redirige los módulos server-only de Next (next/headers, next/cache,
//   next/navigation) que no resuelven fuera del runtime de Next a stubs
//   livianos en tests/stubs/.
import { pathToFileURL } from "node:url";
import path from "node:path";

const projectRoot = path.resolve(import.meta.dirname, "..");

const NEXT_STUBS = {
  "next/headers": "headers.mjs",
  "next/cache": "cache.mjs",
  "next/navigation": "navigation.mjs",
  // El paquete "server-only" tira una excepción incondicional al cargarse
  // (webpack lo intercepta y lo reemplaza por un no-op en builds de
  // servidor; fuera de webpack, en Node puro, siempre explota). Se shimea
  // a un módulo vacío para tests, como recomienda la propia doc del
  // paquete para este escenario.
  "server-only": "server-only.mjs",
};

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith("@/")) {
    const mapped = pathToFileURL(path.join(projectRoot, "src", specifier.slice(2) + ".ts")).href;
    return nextResolve(mapped, context);
  }
  if (specifier in NEXT_STUBS) {
    const mapped = pathToFileURL(path.join(projectRoot, "tests", "stubs", NEXT_STUBS[specifier])).href;
    return nextResolve(mapped, context);
  }
  if (specifier.startsWith(".") && !/\.[a-zA-Z]+$/.test(specifier)) {
    try {
      return await nextResolve(specifier, context);
    } catch (err) {
      if (err?.code !== "ERR_MODULE_NOT_FOUND") throw err;
      return nextResolve(specifier + ".ts", context);
    }
  }
  return nextResolve(specifier, context);
}
