"use server";

import { newsletterSchema } from "@/lib/validation/newsletter";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NewsletterInterestTag } from "@/types/database";

export interface NewsletterActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Lista de intereses activos para pintar los checkboxes del formulario
 * público. Se llama directamente desde el cliente (NewsletterForm), no
 * atada a un <form>: los Server Actions también funcionan como un RPC común
 * cuando se los invoca así.
 */
export async function getActiveNewsletterInterests(): Promise<NewsletterInterestTag[]> {
  if (!isSupabaseConfigured()) return [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("newsletter_interests")
    .select("*")
    .eq("active", true)
    .order("sort_order", { ascending: true });

  return (data ?? []) as NewsletterInterestTag[];
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
      message:
        "Supabase no está configurado en este entorno (modo demo), así que no podemos guardar tu suscripción todavía.",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Solo se guardan intereses que existen y siguen activos: evita basura
    // si el formulario quedó cacheado en el navegador con tags viejos que
    // ya no existen o se desactivaron.
    let interests: string[] = [];
    if (parsed.data.interests.length > 0) {
      const { data: validInterests } = await supabase
        .from("newsletter_interests")
        .select("slug")
        .eq("active", true)
        .in("slug", parsed.data.interests);
      interests = (validInterests ?? []).map((row) => row.slug as string);
    }

    const { error } = await supabase.from("newsletter_subscribers").upsert(
      {
        email: parsed.data.email,
        interests,
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

/**
 * ¿Hay sesión iniciada y ese email ya está suscripto (activo) al
 * newsletter? Se usa para no mostrarle los banners "Suscribite a las
 * novedades" (Navbar, Footer, home) a alguien que ya está adentro — desde
 * Server Components se puede llamar directo; desde un Client Component
 * (Navbar, que detecta la sesión en el browser) funciona igual como RPC.
 *
 * No hace falta pasar el email: lo toma de la sesión, así ningún cliente
 * puede consultar el estado de suscripción de otra persona. La RLS
 * `newsletter_select_own` (auth.uid() = user_id) ya lo garantiza igual del
 * lado de la base, pero conviene no depender solo de eso.
 */
export async function isCurrentUserNewsletterSubscriber(): Promise<boolean> {
  if (!isSupabaseConfigured()) return false;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return false;

  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("id")
    .eq("email", user.email)
    .eq("status", "activo")
    .maybeSingle();

  return Boolean(data);
}
