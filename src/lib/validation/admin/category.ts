import { z } from "zod";

export const categorySchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2, "Ingresá un slug.")
    .max(60)
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Solo minúsculas, números y guiones (ej: suspension)."),
  name: z.string().trim().min(2, "Ingresá un nombre.").max(80),
  description: z.string().trim().max(300),
  status: z.enum(["draft", "published", "hidden", "discontinued"]),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;
