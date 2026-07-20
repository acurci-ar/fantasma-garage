"use server";

import { newsletterSchema } from "@/lib/validation/newsletter";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface NewsletterActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Alta (o actualización) de una suscripción al newsletter. Público y
 * anónimo por diseño — no hace falta cuenta para suscribirse. Si hay
 * sesión iniciada, el registro queda linkeado a user_id (permitido por la
 * RLS `newsletter_public_insert`); si no, queda anónimo.
 *
 * Usa upsert por email: volver a enviar el formulario con el mismo email
 * (por ejemplo para cambiar los intereses) actualiza el registro existente
 * en vez de fallar por la constraint unique.
 */
export async function subscribeNewsletter(
  _prevState: NewsletterActionState,
  formData: FormData
): Promise<NewsletterActionState> {
  const parsed = newsletterSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    interests: formData.getAll("interests").map(String),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá el email ingresado.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message: "Supabase no está configurado en este entorno (modo demo), así que no podemos guardar tu suscripción todavía.",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email: parsed.data.email,
        interests: parsed.data.interests,
        user_id: user?.id ?? null,
        status: "activo",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "email" }
    );

    if (error) throw error;

    return { status: "success", message: "¡Listo! Ya estás suscripto a las novedades." };
  } catch (error) {
    console.error("[newsletter] Error al suscribir:", error);
    return { status: "error", message: "No pudimos guardar tu suscripción. Probá de nuevo." };
  }
}
