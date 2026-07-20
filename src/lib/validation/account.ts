import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max).optional().or(z.literal(""));

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Ingresá tu nombre completo.").max(120),
  phone: optionalText(40),
  document_number: optionalText(30),
  shipping_street: optionalText(160),
  shipping_city: optionalText(80),
  shipping_province: optionalText(80),
  shipping_postal_code: optionalText(20),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
