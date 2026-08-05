import { z } from "zod";

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, "Ingresá tu nombre completo.").max(120),
  email: z.string().trim().email("Ingresá un email válido."),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  subject: z.string().trim().min(2, "Contanos brevemente el motivo.").max(160),
  message: z.string().trim().min(10, "El mensaje debe tener al menos 10 caracteres.").max(2000),
  // Honeypot anti-spam: campo oculto que un usuario real nunca completa.
  // A propósito NO se restringe acá a "" (con z.string().max(0) fallaba la
  // validación entera con un error 400 genérico apenas un bot lo llenaba,
  // sin llegar nunca al chequeo `if (parsed.data.company)` de
  // actions/contact.ts — que es el que devuelve un falso "éxito" sin
  // persistir, para no delatarle al bot que lo detectamos). Cualquier
  // string pasa el parseo; quien decide qué hacer con un honeypot lleno es
  // la Server Action, no el schema.
  company: z.string(),
});

export type ContactFormValues = z.infer<typeof contactFormSchema>;
