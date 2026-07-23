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
  // Ficha extendida del vehículo (fase 1). vin/engine/transmission son
  // públicos si el proyecto es público; client_name es siempre privado
  // (ver has_project_access en 0011_project_expansion.sql).
  vin: z.string().trim().max(40),
  engine: z.string().trim().max(120),
  transmission: z.string().trim().max(120),
  client_name: z.string().trim().max(160),
  visibility: z.enum(["public", "private"]),
});

export type ProjectFormValues = z.infer<typeof projectSchema>;

export const projectImageSchema = z.object({
  url: urlOrPath,
  alt: z.string().trim().max(200),
  stage: z.string().trim().max(80),
  stage_id: z.string().trim().max(80),
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
  is_before: z.boolean(),
  is_after: z.boolean(),
  visibility: z.enum(["public", "private"]),
});

export type ProjectImageFormValues = z.infer<typeof projectImageSchema>;

// ---------------------------------------------------------------------------
// Accesos (proyectos privados)
// ---------------------------------------------------------------------------

export const projectAccessSchema = z.object({
  email: z.string().trim().toLowerCase().email("Ingresá un email válido."),
});

export type ProjectAccessFormValues = z.infer<typeof projectAccessSchema>;

// ---------------------------------------------------------------------------
// Línea de tiempo (hitos)
// ---------------------------------------------------------------------------

const optionalDate = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Date.parse(v)), "Ingresá una fecha válida.");

export const projectStageSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre.").max(80),
  enabled: z.boolean(),
  status: z.enum(["pendiente", "en_curso", "completo"]),
  started_at: optionalDate,
  completed_at: optionalDate,
  notes: z.string().trim().max(2000),
});

export type ProjectStageFormValues = z.infer<typeof projectStageSchema>;

export const projectCustomStageSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre para el hito.").max(80),
});

export type ProjectCustomStageFormValues = z.infer<typeof projectCustomStageSchema>;

// ---------------------------------------------------------------------------
// Multimedia: videos (YouTube o archivo propio)
// ---------------------------------------------------------------------------

const youTubeUrl = z
  .string()
  .trim()
  .refine((v) => /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\//.test(v), "Ingresá una URL de YouTube válida.");

export const projectVideoSchema = z.object({
  kind: z.enum(["youtube", "file"]),
  youtube_url: z.union([youTubeUrl, z.literal("")]),
  video_url: urlOrPath,
  visibility: z.enum(["public", "private"]),
  stage_id: z.string().trim().max(80),
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
});

export type ProjectVideoFormValues = z.infer<typeof projectVideoSchema>;

// ---------------------------------------------------------------------------
// Documentación (siempre privada)
// ---------------------------------------------------------------------------

export const projectDocumentSchema = z.object({
  name: z.string().trim().min(1, "Ingresá un nombre para el documento.").max(160),
});

export type ProjectDocumentFormValues = z.infer<typeof projectDocumentSchema>;

// ---------------------------------------------------------------------------
// Seguimiento presupuesto: presupuesto, gastos/extras, horas
// ---------------------------------------------------------------------------

const money = z
  .string()
  .trim()
  .refine((v) => v === "" || (!Number.isNaN(Number(v)) && Number(v) >= 0), "Ingresá un monto válido.");

export const projectBudgetSchema = z.object({
  amount: money.transform((v) => (v === "" ? null : Number(v))),
  currency: z.enum(["ARS", "USD"]),
  notes: z.string().trim().max(2000),
});

export type ProjectBudgetFormValues = z.infer<typeof projectBudgetSchema>;

export const projectExpenseSchema = z.object({
  kind: z.enum(["gasto", "extra"]),
  description: z.string().trim().min(1, "Ingresá una descripción.").max(200),
  amount: money.refine((v) => v !== "", "Ingresá un monto.").transform(Number),
  currency: z.enum(["ARS", "USD"]),
  expense_date: z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), "Ingresá una fecha válida."),
  category: z.string().trim().max(80),
});

export type ProjectExpenseFormValues = z.infer<typeof projectExpenseSchema>;

export const projectTimeEntrySchema = z.object({
  description: z.string().trim().max(200),
  hours: z
    .string()
    .trim()
    .refine((v) => v !== "" && !Number.isNaN(Number(v)) && Number(v) > 0, "Ingresá una cantidad de horas válida.")
    .transform(Number),
  entry_date: z.string().trim().refine((v) => !Number.isNaN(Date.parse(v)), "Ingresá una fecha válida."),
});

export type ProjectTimeEntryFormValues = z.infer<typeof projectTimeEntrySchema>;
