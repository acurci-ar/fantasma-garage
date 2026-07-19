import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre completo.").max(120),
  email: z.string().trim().email("Ingresá un email válido."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Contanos brevemente el motivo.").max(160),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres.").max(2000),
  // honeypot anti-spam: debe llegar vacío
  company: z.string().max(0).optional().or(z.literal("")),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
