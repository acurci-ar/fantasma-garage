import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sanitizeRedirect } from "@/lib/utils/redirect";

/**
 * Destino de los links de confirmación de email (signup) que manda
 * Supabase — ver emailRedirectTo en features/home/AuthForm.tsx.
 *
 * @supabase/ssr usa flujo PKCE por defecto: Supabase valida el link y
 * redirige acá con `?code=...`; sin intercambiar ese code por una sesión
 * server-side (exchangeCodeForSession), el usuario queda con el email
 * confirmado pero sin sesión iniciada — tendría que loguearse de nuevo a
 * mano. Esta ruta hace ese intercambio y de paso deja la cookie de sesión
 * puesta, así que al llegar a /cuenta ya está logueado.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = sanitizeRedirect(searchParams.get("next") ?? undefined);

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Link inválido, ya usado, o expirado: mandamos a login con un aviso en
  // vez de dejar al usuario colgado en una URL de error de Supabase.
  return NextResponse.redirect(`${origin}/login?error=confirm_failed`);
}
