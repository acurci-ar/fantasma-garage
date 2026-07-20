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

  const pathname = request.nextUrl.pathname;
  const isProtected =
    pathname.startsWith("/admin") || pathname.startsWith("/cuenta") || pathname.startsWith("/checkout");

  if (isProtected && !user) {
    const loginUrl = new URL("/login", request.url);
    // En /checkout forzamos login antes de dejar pasar (sin checkout de
    // invitado): guardamos a dónde volver para no perder el carrito de
    // vista una vez que inicie sesión o confirme el registro.
    if (pathname.startsWith("/checkout")) {
      loginUrl.searchParams.set("redirect", "/checkout");
    }
    return NextResponse.redirect(loginUrl);
  }

  return response;
}

// /cuenta (panel de cliente) y /checkout (para que todo pedido quede ligado
// a un usuario) exigen sesión igual que /admin. /cuenta además redirige a
// /admin si el usuario logueado es staff.
export const config = {
  matcher: ["/admin/:path*", "/cuenta/:path*", "/checkout"],
};
