import { z } from "zod";

/**
 * Los intereses ya no son un set fijo (ver newsletter_interests, editable
 * desde /admin/newsletter/intereses): acá solo se valida forma (strings no
 * vacíos), no pertenencia. Cuál de esos strings es realmente un interés
 * vigente se resuelve server-side contra la tabla, en subscribeNewsletter.
 */
export const newsletterSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  interests: z.array(z.string().trim().min(1)).default([]),
});

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
