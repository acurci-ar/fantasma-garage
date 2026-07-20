import { z } from "zod";

export const profileSchema = z.object({
  full_name: z.string().trim().min(2, "Ingresá tu nombre completo.").max(120),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
