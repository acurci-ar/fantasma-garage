import { z } from "zod";

const urlOrPath = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Ingresá una ruta (/images/...) o URL válida.");

const optionalMoney = z
  .string()
  .trim()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ingresá un precio válido.")
  .transform((v) => (v === "" ? null : Number(v)));

const optionalInt = (label: string) =>
  z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), `Ingresá ${label} válido.`)
    .transform((v) => (v === "" ? null : Number(v)));

const optionalDateTime = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Ingresá una fecha válida.")
  .transform((v) => (v === "" ? null : new Date(v).toISOString()));

export const carSchema = z.object({
  title: z.string().trim().min(2, "Ingresá un título.").max(160),
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .max(160)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej: chevy-nova-1972)."),
  make: z.string().trim().min(1, "Ingresá la marca.").max(80),
  model: z.string().trim().min(1, "Ingresá el modelo.").max(80),
  year: z
    .string()
    .trim()
    .refine(
      (v) => v !== "" && Number.isInteger(Number(v)) && Number(v) >= 1900 && Number(v) <= 2100,
      "Ingresá un año válido."
    )
    .transform(Number),
  price: optionalMoney,
  currency: z.enum(["ARS", "USD"]),
  mileage_km: optionalInt("un kilometraje"),
  engine: z.string().trim().max(120),
  transmission: z.string().trim().max(120),
  color: z.string().trim().max(60),
  summary: z.string().trim().min(2, "Ingresá un resumen.").max(300),
  description: z.string().trim().max(4000),
  status: z.enum(["draft", "published", "hidden", "discontinued"]),
  published_from: optionalDateTime,
  published_until: optionalDateTime,
  cover_url: urlOrPath,
  seo_title: z.string().trim().max(160),
  seo_description: z.string().trim().max(300),
});

export type CarFormValues = z.infer<typeof carSchema>;

export const carImageSchema = z.object({
  url: urlOrPath,
  alt: z.string().trim().max(200),
});

export type CarImageFormValues = z.infer<typeof carImageSchema>;

const youTubeUrl = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(v), "Ingresá una URL de YouTube válida.");

export const carVideoSchema = z.object({
  kind: z.enum(["youtube", "file"]),
  youtube_url: z.union([youTubeUrl, z.literal("")]),
  video_url: urlOrPath,
});

export type CarVideoFormValues = z.infer<typeof carVideoSchema>;
