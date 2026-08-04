import { z } from "zod";

export const productImageSchema = z.object({
  url: z
    .string()
    .trim()
    .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Ingresá una ruta (/images/...) o URL válida."),
  alt: z.string().trim().max(200),
});

export type ProductImageFormValues = z.infer<typeof productImageSchema>;
