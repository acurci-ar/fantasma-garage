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

export const productSchema = z.object({
  name: z.string().trim().min(2, "Ingresá un nombre.").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej: kit-suspension)."),
  sku: z.string().trim().min(2, "Ingresá un SKU.").max(60),
  short_description: z.string().trim().max(300),
  description: z.string().trim().max(4000),
  price: numberField("un precio válido"),
  sale_price: z
    .string()
    .trim()
    .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ingresá un precio de oferta válido.")
    .transform((v) => (v === "" ? null : Number(v))),
  stock: intField("el stock disponible"),
  low_stock_threshold: intField("el umbral de stock bajo"),
  currency: z.enum(["ARS", "USD"]),
  status: z.enum(["draft", "published", "hidden", "discontinued"]),
  image_url: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Ingresá una ruta (/images/...) o URL válida."),
  image_alt: z.string().trim().max(200),
});

export type ProductFormValues = z.infer<typeof productSchema>;
