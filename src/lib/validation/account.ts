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

export const changePasswordSchema = z
  .object({
    current_password: z.string().min(1, "Ingresá tu contraseña actual."),
    new_password: z.string().min(8, "La nueva contraseña tiene que tener al menos 8 caracteres.").max(72),
    confirm_password: z.string().min(1, "Repetí la nueva contraseña."),
  })
  .refine((data) => data.new_password === data.confirm_password, {
    message: "Las contraseñas no coinciden.",
    path: ["confirm_password"],
  })
  .refine((data) => data.new_password !== data.current_password, {
    message: "La nueva contraseña tiene que ser distinta de la actual.",
    path: ["new_password"],
  });

export type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>;
