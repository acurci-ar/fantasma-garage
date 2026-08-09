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

/**
 * Para "Preferencias de newsletter" en /cuenta: a diferencia de
 * newsletterSchema, no lleva `email` — la acción usa el de la sesión, no
 * uno tipeado a mano (ver updateNewsletterPreferences en actions/newsletter.ts).
 */
export const newsletterPreferencesSchema = z.object({
  interests: z.array(z.string().trim().min(1)).default([]),
});

export type NewsletterPreferencesFormValues = z.infer<typeof newsletterPreferencesSchema>;
