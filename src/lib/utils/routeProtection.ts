/**
 * Decisión pura de qué rutas exigen sesión y a dónde mandar el login —
 * extraída de middleware.ts (fase 1 del plan de cobertura de Tomás,
 * ago-2026) para poder testearla sin un request de Next ni una sesión de
 * Supabase real. El middleware sigue siendo responsable de la parte con
 * efectos (leer la cookie de sesión, hacer el redirect real).
 */

const PROTECTED_PREFIXES = ["/admin", "/cuenta", "/checkout"] as const;

/** /admin, /cuenta y /checkout (y sus subrutas) exigen sesión — ver middleware.ts y matcher en su config. */
export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => pathname.startsWith(prefix));
}

/**
 * Query params para agregar a la URL de /login cuando se redirige desde una
 * ruta protegida sin sesión. Solo /checkout necesita volver ahí después del
 * login (no hay checkout de invitado); /admin y /cuenta mandan al login
 * "pelado" — su flujo post-login ya resuelve a dónde ir según el rol.
 */
export function loginRedirectParams(pathname: string): Record<string, string> {
  if (pathname.startsWith("/checkout")) {
    return { redirect: "/checkout" };
  }
  return {};
}
