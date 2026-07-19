import { z } from "zod";

export const checkoutItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable(),
  quantity: z.number().int().min(1).max(99),
});

export const checkoutFormSchema = z.object({
  fullName: z.string().trim().min(2, "Ingresá tu nombre completo.").max(120),
  email: z.string().trim().email("Ingresá un email válido."),
  phone: z.string().trim().min(6, "Ingresá un teléfono de contacto.").max(40),
  street: z.string().trim().min(3, "Ingresá la calle y el número.").max(160),
  city: z.string().trim().min(2, "Ingresá la localidad.").max(120),
  province: z.string().trim().min(2, "Ingresá la provincia.").max(120),
  postalCode: z.string().trim().min(3, "Ingresá el código postal.").max(20),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
  items: z.array(checkoutItemSchema).min(1, "Tu carrito está vacío."),
});

export type CheckoutFormValues = z.infer<typeof checkoutFormSchema>;
export type CheckoutItemInput = z.infer<typeof checkoutItemSchema>;
