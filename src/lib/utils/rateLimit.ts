import "server-only";
import { headers } from "next/headers";

export { checkRateLimit, __resetRateLimitBuckets } from "./rateLimitCore";
export type { RateLimitResult } from "./rateLimitCore";

/**
 * IP del cliente a partir de los headers que agrega el proxy de Vercel.
 * "unknown" como fallback (local sin proxy, tests, etc.) — se agrupa todo
 * ese tráfico bajo una sola key, lo cual es aceptable: en local no hay
 * abuso real que limitar.
 */
export function getClientIp(): string {
  const h = headers();
  const forwarded = h.get("x-forwarded-for");
  if (forwarded) return (forwarded.split(",")[0] ?? forwarded).trim();
  return h.get("x-real-ip") ?? "unknown";
}
