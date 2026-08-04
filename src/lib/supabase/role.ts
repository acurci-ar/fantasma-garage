import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Role } from "@/types/database";

/**
 * Rol del usuario logueado actual, o null si no hay sesión / Supabase no
 * está configurado. Pensado para gatear UI que ya está protegida por RLS
 * (ej. la sección de información interna de productos, is_admin() —
 * defensa en profundidad, no la única barrera: ver sección 7.1).
 */
export async function getCurrentRole(): Promise<Role | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  return profile?.role ?? null;
}
