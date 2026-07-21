import { z } from "zod";

const urlOrPath = z
  .string()
  .trim()
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\//.test(v), "Ingresá una ruta (/images/...) o URL válida.");

export const gallerySchema = z.object({
  title: z.string().trim().min(2, "Ingresá un título.").max(120),
  description: z.string().trim().max(300),
  status: z.enum(["draft", "published", "hidden", "discontinued"]),
  cover_url: urlOrPath,
});

export type GalleryFormValues = z.infer<typeof gallerySchema>;

export const galleryImageSchema = z.object({
  url: urlOrPath,
  alt: z.string().trim().max(200),
  caption: z.string().trim().max(300),
  position: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "El orden debe ser un número entero.")
    .transform((v) => (v === "" ? 0 : Number(v))),
});

export type GalleryImageFormValues = z.infer<typeof galleryImageSchema>;
