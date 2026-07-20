/**
 * Evita open redirects: solo se acepta un path relativo interno (empieza
 * con "/", no es "//algo" y no contiene un esquema tipo "://"). Se usa para
 * sanear el query param ?redirect= que viaja entre /checkout, /login y
 * /registro cuando forzamos el login antes de confirmar un pedido.
 */
export function sanitizeRedirect(path: string | string[] | undefined, fallback = "/cuenta"): string {
  const value = Array.isArray(path) ? path[0] : path;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("://")) {
    return fallback;
  }
  return value;
}
