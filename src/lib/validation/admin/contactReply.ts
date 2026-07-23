import { z } from "zod";

export const contactReplySchema = z.object({
  body: z.string().trim().min(5, "Escribí una respuesta.").max(5000, "Máximo 5000 caracteres."),
});

export type ContactReplyFormValues = z.infer<typeof contactReplySchema>;
