import { z } from "zod";

const numberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) >= 0, `Ingresá ${label}.`)
    .transform(Number);

const intField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 0, `Ingresá ${label}.`)
    .transform(Number);

/** Como numberField, pero "" es válido y se transforma a null (para campos opcionales de la info interna). */
const optionalNumberField = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), `Ingresá ${label} válido.`)
    .transform((v) => (v === "" ? null : Number(v)));

export const productSchema = z.object({
  name: z.string().trim().min(2, "Ingresá un nombre.").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej: kit-suspension)."),
  // Se puede dejar vacío: actions/admin/products.ts lo autocompleta con el
  // slug antes de llegar acá si no se cargó a mano. La unicidad la garantiza
  // el constraint de la columna (ver 0001_init.sql).
  sku: z.string().trim().max(60),
  short_description: z.string().trim().max(300),
  description: z.string().trim().max(4000),
  // También puede llegar vacío: si se completó la info interna (costo +
  // peso), actions/admin/products.ts lo autocompleta con el Precio Sugerido
  // antes de validar.
  price: z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ingresá un precio válido.")
    .transform((v) => (v === "" ? null : Number(v))),
  sale_price: z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ingresá un precio de oferta válido.")
    .transform((v) => (v === "" ? null : Number(v))),
  stock: intField("el stock disponible"),
  low_stock_threshold: intField("el umbral de stock bajo"),
  currency: z.enum(["ARS", "USD"]),
  status: z.enum(["draft", "published", "hidden", "discontinued"]),
  category_id: z.string().trim(),
  featured: z.boolean(),
});

export type ProductFormValues = z.infer<typeof productSchema>;

/** Info interna de costos (solo admin) — todos los campos son opcionales: se puede ir completando de a poco. */
export const productInternalSchema = z.object({
  supplier_name: z.string().trim().max(160),
  supplier_link: z
    .string()
    .trim()
    .refine((v) => v === "" || /^https?:\/\//.test(v), "El link tiene que empezar con http:// o https://.")
    .transform((v) => (v === "" ? null : v)),
  cost_price: optionalNumberField("un precio del producto"),
  weight_kg: optionalNumberField("un peso"),
  // Moneda en la que está cargado cost_price ("Precio producto"). Puede
  // diferir de `currency` (la del precio público) — ej. costo cargado en
  // USD pero el producto se vende en ARS. Ver ProductForm.tsx para la
  // comparación de precio-vs-costo currency-aware usando el dólar blue.
  currency: z.enum(["ARS", "USD"]),
});
