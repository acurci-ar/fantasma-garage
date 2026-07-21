import { z } from "zod";

const urlOrPath = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Ingresá una ruta (/images/...) o URL válida.");

export const projectSchema = z.object({
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
  summary: z.string().trim().min(2, "Ingresá un resumen.").max(300),
  story: z.string().trim().max(4000),
  status: z.enum(["en_curso", "finalizado", "en_pausa"]),
  featured: z.boolean(),
  seo_title: z.string().trim().max(160),
  seo_description: z.string().trim().max(300),
  cover_url: urlOrPath,
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const projectImageSchema = z.object({
  url: urlOrPath,
  alt: z.string().trim().max(200),
  stage: z.string().trim().max(80),
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
  is_before: z.boolean(),
  is_after: z.boolean(),
});

export type ProjectImageFormValues = z.infer<typeof projectImageSchema>;
