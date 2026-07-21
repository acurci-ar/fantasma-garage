"use server";

import { revalidatePath } from "next/cache";
import { siteSettingsSchema } from "@/lib/validation/admin/siteSettings";
import { createClient } from "@/lib/supabase/server";

export interface SiteSettingsActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * site_settings es una tabla key/value (ver supabase/migrations/0001_init.sql):
 * cada campo del formulario es una fila `{ key, value_json }` independiente.
 * Guardamos todo con un solo upsert en batch. Los numéricos (years_experience,
 * projects_completed) se guardan como number en value_json — el resto como
 * string, igual que getSiteSettings() los espera de vuelta.
 */
export async function updateSiteSettings(
  _prevState: SiteSettingsActionState,
  formData: FormData
): Promise<SiteSettingsActionState> {
  const raw = Object.fromEntries(
    [
      "whatsapp_number",
      "contact_email",
      "address",
      "business_hours",
      "instagram_url",
      "youtube_channel_url",
      "youtube_playlist_url",
      "years_experience",
      "projects_completed",
      "address_street",
      "address_locality",
      "address_region",
      "address_postal_code",
      "address_country",
      "phone_e164",
      "geo_lat",
      "geo_lng",
      "price_range",
    ].map((key) => [key, String(formData.get(key) ?? "")])
  );

  const parsed = siteSettingsSchema.safeParse(raw);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const numericKeys = new Set(["years_experience", "projects_completed"]);
  const rows = Object.entries(parsed.data).map(([key, value]) => ({
    key,
    value_json: numericKeys.has(key) ? Number(value || 0) : value,
  }));

  const supabase = await createClient();
  const { error } = await supabase.from("site_settings").upsert(rows, { onConflict: "key" });

  if (error) {
    return { status: "error", message: "No pudimos guardar la configuración." };
  }

  // Revalida el layout raíz: Footer y el JSON-LD leen getSiteSettings() ahí,
  // y ese layout envuelve todas las rutas del sitio.
  revalidatePath("/", "layout");
  return { status: "success", message: "Configuración guardada." };
}
