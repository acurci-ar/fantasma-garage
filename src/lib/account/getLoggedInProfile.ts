import "server-only";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/types/database";

export interface LoggedInProfile {
  email: string;
  profile: Profile | null;
}

/**
 * Perfil del cliente logueado (si hay sesión), para precompletar
 * formularios públicos (contacto, checkout) con los datos que ya tenemos
 * en vez de pedírselos de nuevo. Devuelve undefined si no hay sesión o
 * Supabase no está configurado (modo demo).
 */
export async function getLoggedInProfile(): Promise<LoggedInProfile | undefined> {
  if (!isSupabaseConfigured()) return undefined;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return undefined;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  return { email: user.email ?? "", profile: (profile as Profile | null) ?? null };
}
