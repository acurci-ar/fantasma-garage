import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Cliente Supabase con SERVICE ROLE KEY. Bypassa RLS.
 *
 * USO EXCLUSIVO EN SERVIDOR: Server Actions, Route Handlers o Edge
 * Functions que necesiten operar con privilegios elevados (ej. webhook de
 * Mercado Pago actualizando pedidos, tareas administrativas). Nunca importar
 * este módulo desde un Client Component ni exponer SUPABASE_SERVICE_ROLE_KEY
 * con el prefijo NEXT_PUBLIC_.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Falta configurar SUPABASE_SERVICE_ROLE_KEY (y NEXT_PUBLIC_SUPABASE_URL) para usar el cliente admin."
    );
  }

  return createSupabaseClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
