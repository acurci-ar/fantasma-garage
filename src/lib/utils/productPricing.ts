/**
 * Lógica pura de producto (sin Supabase ni FormData) para que sea testeable
 * sin levantar Server Actions — extraída de actions/admin/products.ts como
 * parte del plan de cobertura de Tomás (fase 1, ago-2026): antes vivía
 * inline y sin un solo test a pesar de tocar dinero (precio sugerido) e
 * integridad de datos (mensajes de conflicto de SKU/slug).
 */

/**
 * Precio Sugerido = cost_price × 1.12 + shipping × 1.5 — mismo cálculo que
 * la columna generada suggested_price de product_internal_info (ver
 * supabase/migrations/0022_product_shipping_cost_editable.sql), para el
 * fallback server-side cuando el precio llega vacío.
 *
 * `shippingCostOverride`: desde que el costo de envío es editable (ya no
 * siempre peso × 45 USD — ver esa misma migración), si el admin cargó un
 * valor a mano se usa tal cual (incluso si es 0); si no se pasa o es null,
 * se cae al cálculo automático de peso × 45.
 */
export function computeSuggestedPrice(
  costPrice: number | null,
  weightKg: number | null,
  shippingCostOverride?: number | null
): number {
  const shipping = shippingCostOverride ?? (weightKg ?? 0) * 45;
  return Math.round(((costPrice ?? 0) * 1.12 + shipping * 1.5) * 100) / 100;
}

/** Traduce el 23505 (unique_violation) de Postgres al campo del form que lo causó, mirando qué constraint aparece en el mensaje de error. */
export function skuConflictFieldErrors(error: { code?: string; message?: string }): Record<string, string[]> | undefined {
  if (error.code !== "23505") return undefined;
  if (error.message?.includes("sku")) return { sku: ["Ya existe un producto con ese SKU."] };
  if (error.message?.includes("slug")) return { slug: ["Ya existe un producto con ese slug."] };
  return undefined;
}
