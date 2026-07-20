import { z } from "zod";

export const NEWSLETTER_INTERESTS = ["marcas", "modelos", "juntadas", "eventos"] as const;

export const NEWSLETTER_INTEREST_LABELS: Record<(typeof NEWSLETTER_INTERESTS)[number], string> = {
  marcas: "Marcas",
  modelos: "Modelos de auto",
  juntadas: "Juntadas",
  eventos: "Eventos",
};

export const newsletterSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  interests: z.array(z.enum(NEWSLETTER_INTERESTS)).default([]),
});

export type NewsletterFormValues = z.infer<typeof newsletterSchema>;
