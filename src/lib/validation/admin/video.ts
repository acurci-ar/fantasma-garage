import { z } from "zod";

export const videoSchema = z.object({
  title: z.string().trim().min(2, "Ingresá un título.").max(160),
  youtube_url: z
    .string()
    .trim()
    .refine((v) => /youtube\.com|youtu\.be/.test(v), "Ingresá una URL de YouTube válida."),
  featured: z.boolean(),
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
});

export type VideoFormValues = z.infer<typeof videoSchema>;
