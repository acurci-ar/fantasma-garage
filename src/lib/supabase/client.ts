"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Cliente Supabase para uso en Client Components (browser).
 * Usa siempre la anon key pública; nunca la service role key.
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase no está configurado. Definí NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local."
    );
  }

  return createBrowserClient(url, anonKey);
}
