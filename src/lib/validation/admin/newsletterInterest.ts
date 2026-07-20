import { z } from "zod";

export const newsletterInterestSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej: chevy-nova)."),
  label: z.string().trim().min(2, "Ingresá una etiqueta.").max(80),
  active: z.boolean(),
  sort_order: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
});

export type NewsletterInterestFormValues = z.infer<typeof newsletterInterestSchema>;
