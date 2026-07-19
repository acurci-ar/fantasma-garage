import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Refresca la sesión de Supabase en cada request y protege /admin a nivel
 * de middleware (además de la verificación server-side en la propia
 * página). No confiar solo en ocultar botones del frontend (sección 7.1).
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next({ request: { headers: request.headers } });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Sin Supabase configurado (modo demo), no bloqueamos nada.
  if (!url || !anonKey) {
    return response;
  }

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value;
      },
      set(name: string, value: string, options) {
        response.cookies.set({ name, value, ...options });
      },
      remove(name: string, options) {
        response.cookies.set({ name, value: "", ...options });
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (request.nextUrl.pathname.startsWith("/admin") && !user) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// /cuenta queda fuera del matcher: en esta etapa es una vista informativa
// ("próxima etapa"), no una vista protegida. Se agrega a /admin cuando el
// panel completo se implemente.
export const config = {
  matcher: ["/admin/:path*"],
};
