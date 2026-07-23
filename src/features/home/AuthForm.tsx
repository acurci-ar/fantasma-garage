"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

interface AuthFormProps {
  mode: "login" | "register";
  /** A dónde ir tras un login exitoso. Por defecto /cuenta, que a su vez
   * decide admin -> /admin o cliente -> panel. Si viene de /checkout (login
   * forzado antes de confirmar un pedido), vuelve directo ahí. */
  redirectTo?: string;
}

export function AuthForm({ mode, redirectTo = "/cuenta" }: AuthFormProps) {
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !anonKey) {
      setStatus("error");
      setMessage(
        "Supabase no está configurado en este entorno (modo demo). Configurá NEXT_PUBLIC_SUPABASE_URL y NEXT_PUBLIC_SUPABASE_ANON_KEY en .env.local para habilitar el login real."
      );
      return;
    }

    const form = new FormData(e.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } =
        mode === "login"
          ? await supabase.auth.signInWithPassword({ email, password })
          : await supabase.auth.signUp({
              email,
              password,
              // Sin esto, Supabase usa el "Site URL" configurado en su
              // dashboard (Authentication > URL Configuration) para el link
              // de confirmación del email — que por defecto suele quedar en
              // http://localhost:3000. Con window.location.origin apuntamos
              // siempre al dominio real desde el que se registró el usuario
              // (funciona igual en prod, en previews de Vercel y en local),
              // pero igual hay que agregar ese dominio a la lista de
              // "Redirect URLs" del dashboard o Supabase lo va a rechazar.
              //
              // Apunta a /auth/callback (no directo a redirectTo): con el
              // flujo PKCE que usa @supabase/ssr, el link de confirmación
              // llega con ?code=... que hay que intercambiar por una sesión
              // server-side — si no, el usuario queda confirmado pero
              // deslogueado. next=redirectTo es a dónde va una vez logueado.
              options: {
                emailRedirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
              },
            });

      if (error) throw error;

      if (mode === "login") {
        setStatus("success");
        setMessage("Sesión iniciada correctamente. Redirigiendo...");
        // Navegación dura (no router.push) para que la página siguiente se
        // renderice en el servidor ya con la cookie de sesión recién
        // escrita por el cliente de Supabase, sin depender del cache del
        // router de Next. Por defecto /cuenta decide a dónde corresponde ir
        // según el rol; si venimos de un checkout forzado, redirectTo
        // apunta directo ahí.
        window.location.href = redirectTo;
        return;
      }

      setStatus("success");
      setMessage(
        redirectTo === "/cuenta"
          ? "Cuenta creada. Revisá tu email para confirmar el registro."
          : "Cuenta creada. Revisá tu email para confirmar el registro y después iniciá sesión de nuevo para continuar tu pedido."
      );
    } catch (error) {
      setStatus("error");
      setMessage((error as Error).message || "Ocurrió un error. Probá de nuevo.");
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Email
        </label>
        <input id="email" name="email" type="email" required className={inputClasses} />
      </div>
      <div>
        <label htmlFor="password" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Contraseña
        </label>
        <input id="password" name="password" type="password" required minLength={8} className={inputClasses} />
      </div>

      {mode === "login" && (
        <div className="text-right">
          <Link href="/contacto" className="text-xs text-foreground/50 hover:text-primary">
            ¿Olvidaste tu contraseña?
          </Link>
        </div>
      )}

      <Button type="submit" loading={status === "loading"} className="w-full">
        {mode === "login" ? "Iniciar sesión" : "Crear cuenta"}
      </Button>

      {message && (
        <p role="status" aria-live="polite" className={status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>
          {message}
        </p>
      )}

      <p className="text-center text-sm text-foreground/50">
        {mode === "login" ? (
          <>
            ¿No tenés cuenta?{" "}
            <Link
              href={redirectTo === "/cuenta" ? "/registro" : `/registro?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-primary hover:underline"
            >
              Registrate
            </Link>
          </>
        ) : (
          <>
            ¿Ya tenés cuenta?{" "}
            <Link
              href={redirectTo === "/cuenta" ? "/login" : `/login?redirect=${encodeURIComponent(redirectTo)}`}
              className="text-primary hover:underline"
            >
              Iniciá sesión
            </Link>
          </>
        )}
      </p>
    </form>
  );
}
