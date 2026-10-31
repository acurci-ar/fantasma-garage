import { z } from "zod";

/**
 * Validación del ABM de travesías. Las listas (incluye, no incluye,
 * destacados, opcionales, paradas) se cargan en el formulario como texto
 * "una línea por ítem" — es lo más cómodo para pegar desde un documento — y
 * acá se transforman a los JSON que guarda la tabla.
 */

const lines = (v: string) =>
  v
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

const optionalText = z
  .string()
  .trim()
  .max(500)
  .transform((v) => (v === "" ? null : v));

const optionalInt = z
  .string()
  .trim()
  .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Debe ser un número entero positivo.")
  .transform((v) => (v === "" ? null : Number(v)));

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}$/.test(v), "Usá el formato AAAA-MM-DD.")
  .transform((v) => (v === "" ? null : v));

/** "Etiqueta | detalle" por línea → [{label, detail}] */
const highlightsField = z.string().transform((v) =>
  lines(v).map((l) => {
    const [label = "", ...rest] = l.split("|");
    return { label: label.trim(), detail: rest.join("|").trim() };
  })
);

/** "Etiqueta | precio" por línea → [{label, price}] */
const optionalsField = z.string().transform((v) =>
  lines(v).map((l) => {
    const [label = "", ...rest] = l.split("|");
    return { label: label.trim(), price: rest.join("|").trim() || "consultar" };
  })
);

const optionalCoord = z
  .string()
  .trim()
  .refine((v) => v === "" || Number.isFinite(Number(v)), "Ingresá un número (o dejalo vacío).")
  .transform((v) => (v === "" ? null : Number(v)));

export const tripSchema = z.object({
  title: z.string().trim().min(2, "Ingresá un título.").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .max(80)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej. ruta-66)."),
  subtitle: optionalText,
  eyebrow: optionalText,
  summary: z.string().trim().min(10, "Escribí un resumen de al menos 10 caracteres.").max(600),
  description: z.string().trim().max(4000).transform((v) => (v === "" ? null : v)),
  status: z.enum(["draft", "published", "hidden"]),
  show_price: z.boolean(),
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
  start_date: optionalDate,
  end_date: optionalDate,
  duration_label: optionalText,
  price: z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "El precio debe ser un número positivo.")
    .transform((v) => (v === "" ? null : Number(v))),
  currency: z.enum(["USD", "ARS"]),
  price_note: optionalText,
  min_participants: optionalInt,
  max_participants: optionalInt,
  cover_url: z.string().trim().max(1000),
  cover_credit: optionalText,
  cta_label: optionalText,
  cta_url: z
    .string()
    .trim()
    .max(1000)
    .refine((v) => v === "" || /^https?:\/\//.test(v), "Ingresá una URL completa (https://...).")
    .transform((v) => (v === "" ? null : v)),
  highlights: highlightsField,
  includes: z.string().transform(lines),
  excludes: z.string().transform(lines),
  optionals: optionalsField,
  seo_title: optionalText,
  seo_description: optionalText,
});

export type TripFormValues = z.infer<typeof tripSchema>;

export const tripDaySchema = z.object({
  day_label: z.string().trim().min(1, "Ingresá la etiqueta del día.").max(40),
  date_label: optionalText,
  title: z.string().trim().min(2, "Ingresá un título.").max(160),
  description: z.string().trim().min(10, "Escribí una descripción de al menos 10 caracteres.").max(3000),
  highlights: z.string().transform(lines),
  lodging: optionalText,
  meals: optionalText,
  distance_km: optionalInt,
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
  image_url: z.string().trim().max(1000),
  image_credit: optionalText,
  secondary_image_url: z.string().trim().max(1000),
  secondary_image_credit: optionalText,
  // Lugar geográfico del día, para el mapa del recorrido.
  place_name: optionalText,
  place_lat: optionalCoord,
  place_lng: optionalCoord,
});

export type TripDayFormValues = z.infer<typeof tripDaySchema>;

/** Inversas, para precargar los textareas al editar. */
export const toLines = (items: string[] | null | undefined) => (items ?? []).join("\n");
export const highlightsToLines = (items: { label: string; detail: string }[] | null | undefined) =>
  (items ?? []).map((h) => `${h.label} | ${h.detail}`).join("\n");
export const optionalsToLines = (items: { label: string; price: string }[] | null | undefined) =>
  (items ?? []).map((o) => `${o.label} | ${o.price}`).join("\n");
