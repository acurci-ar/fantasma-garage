/**
 * Indica si hay credenciales de Supabase configuradas. Se usa en toda la capa
 * de contenido (lib/content/queries.ts) para decidir si se consulta la base
 * real o se usan los datos seed locales, de forma que el proyecto sea
 * ejecutable de punta a punta sin depender de un proyecto Supabase.
 */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}
