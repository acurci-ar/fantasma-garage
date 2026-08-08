"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";

const REDIRECT_SECONDS = 5;

/**
 * Pantalla de éxito tras confirmar el email (ver /auth/callback, que
 * redirige acá una vez canjeado el ?code por sesión). A los 5s manda solo
 * a /login, arrastrando el redirectTo original si venía de un checkout
 * forzado, para no perder el "volver a donde estaba" post-login.
 */
export function EmailConfirmadoView({ redirectTo }: { redirectTo: string | null }) {
  const router = useRouter();
  const [secondsLeft, setSecondsLeft] = useState(REDIRECT_SECONDS);

  useEffect(() => {
    const target = redirectTo ? `/login?redirect=${encodeURIComponent(redirectTo)}` : "/login";
    const interval = setInterval(() => setSecondsLeft((s) => Math.max(0, s - 1)), 1000);
    const timeout = setTimeout(() => router.push(target), REDIRECT_SECONDS * 1000);
    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Section className="flex min-h-[80vh] items-center pt-32">
      <div className="mx-auto w-full max-w-sm">
        <SectionHeading eyebrow="Mi cuenta" title="Email confirmado" align="center" />
        <Panel className="mt-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-7 w-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <p className="text-sm text-foreground/80">
            Tu email quedó confirmado correctamente. Ya podés iniciar sesión con tu cuenta.
          </p>
          <p className="mt-4 text-xs text-foreground/40">
            Te llevamos a la pantalla de inicio de sesión en {secondsLeft} segundo{secondsLeft === 1 ? "" : "s"}
            &hellip;
          </p>
        </Panel>
      </div>
    </Section>
  );
}
