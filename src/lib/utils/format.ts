/** Formatea un precio en la moneda indicada usando locale es-AR. */
export function formatCurrency(amount: number, currency: "ARS" | "USD" = "ARS"): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Formatea una fecha ISO a formato largo en español. */
export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(iso));
}

const DIACRITICS_REGEX = new RegExp("[\\u0300-\\u036f]", "g");

/** Genera un slug a partir de un texto libre (usado como fallback en formularios admin futuros). */
export function slugify(text: string): string {
  return text
    .normalize("NFD")
    .replace(DIACRITICS_REGEX, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}
