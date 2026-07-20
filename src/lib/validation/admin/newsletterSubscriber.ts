import { z } from "zod";

export const newsletterSubscriberSchema = z.object({
  email: z.string().trim().email("Ingresá un email válido."),
  interests: z.array(z.string().trim().min(1)).default([]),
  status: z.enum(["activo", "baja"]),
});

export type NewsletterSubscriberFormValues = z.infer<typeof newsletterSubscriberSchema>;
