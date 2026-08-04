/**
 * Lógica pura del rate limiter (sin "server-only" ni next/headers) para
 * que sea testeable con el test runner de Node sin tener que levantar un
 * request context de Next — ver rateLimit.ts, que envuelve esto agregando
 * getClientIp() y el guard de server-only.
 *
 * Rate limiting best-effort en memoria, por proceso (sección 7.1 —
 * hallazgo de la auditoría de Santiago, ago-2026: checkout, contacto y
 * newsletter no tenían ningún límite propio, solo el rate limit por
 * defecto de Supabase Auth para el login).
 *
 * Importante: esto NO es un rate limit "duro" en producción serverless.
 * Cada invocación de una función de Vercel puede caer en una instancia
 * distinta (y el Map se pierde en cada cold start), así que un atacante
 * distribuido igual puede eludirlo. Sirve como primera barrera contra
 * abuso trivial (un script pegándole desde una sola conexión/instancia
 * tibia) y dificulta el caso común, no el sofisticado. Si el abuso real
 * se vuelve un problema, reemplazar este Map por un store compartido
 * (Upstash Redis + @upstash/ratelimit es la opción más simple sobre
 * Vercel) — la firma de checkRateLimit está pensada para que ese cambio
 * no toque los call sites.
 */
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

const SWEEP_INTERVAL_MS = 5 * 60 * 1000;
let lastSweep = Date.now();

/** Poda entradas vencidas cada tanto (no en cada request) para que el Map no crezca sin límite en un proceso de larga vida (dev, self-host). */
function sweepExpired(now: number) {
  if (now - lastSweep < SWEEP_INTERVAL_MS) return;
  lastSweep = now;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
}

export interface RateLimitResult {
  allowed: boolean;
  /** Segundos hasta que se pueda reintentar. 0 si allowed es true. */
  retryAfterSeconds: number;
}

/** Ventana fija: hasta `limit` intentos por `key` cada `windowMs`. */
export function checkRateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  sweepExpired(now);

  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, retryAfterSeconds: 0 };
  }

  if (bucket.count >= limit) {
    return { allowed: false, retryAfterSeconds: Math.ceil((bucket.resetAt - now) / 1000) };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterSeconds: 0 };
}

/** Solo para tests: vacía todos los buckets entre casos. */
export function __resetRateLimitBuckets() {
  buckets.clear();
}
