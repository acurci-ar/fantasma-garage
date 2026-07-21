import { z } from "zod";

const optionalText = (max: number) => z.string().trim().max(max);

const optionalLatLng = z
  .string()
  .trim()
  .refine((v) => v === "" || !Number.isNaN(Number(v)), "Ingresá un número (o dejalo vacío).");

const optionalE164Phone = z
  .string()
  .trim()
  .refine((v) => v === "" || /^\+\d{8,15}$/.test(v), "Formato E.164, ej. +5491122334455 (o dejalo vacío).");

/**
 * Todos los campos de contacto/negocio en un solo formulario. Se guardan
 * como filas sueltas en site_settings (key/value_json) — ver
 * actions/admin/settings.ts. Los campos "estructurados" (address_*, geo_*,
 * phone_e164, price_range) alimentan el JSON-LD del layout raíz; si quedan
 * vacíos, ese JSON-LD simplemente omite esa parte en vez de mentir.
 */
export const siteSettingsSchema = z.object({
  whatsapp_number: optionalText(40),
  contact_email: z.string().trim().refine((v) => v === "" || z.string().email().safeParse(v).success, "Email inválido."),
  address: optionalText(200),
  business_hours: optionalText(120),
  instagram_url: optionalText(200),
  youtube_channel_url: optionalText(200),
  youtube_playlist_url: optionalText(300),
  years_experience: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Ingresá un número entero."),
  projects_completed: z
    .string()
    .trim()
    .refine((v) => v === "" || (Number.isInteger(Number(v)) && Number(v) >= 0), "Ingresá un número entero."),
  address_street: optionalText(200),
  address_locality: optionalText(120),
  address_region: optionalText(120),
  address_postal_code: optionalText(20),
  address_country: optionalText(2),
  phone_e164: optionalE164Phone,
  geo_lat: optionalLatLng,
  geo_lng: optionalLatLng,
  price_range: optionalText(10),
});

export type SiteSettingsFormValues = z.infer<typeof siteSettingsSchema>;
