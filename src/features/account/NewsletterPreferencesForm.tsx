"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import {
  updateNewsletterPreferences,
  unsubscribeCurrentUserFromNewsletter,
  type NewsletterPreferencesActionState,
} from "@/actions/newsletter";
import type { NewsletterInterestTag, NewsletterSubscriber } from "@/types/database";

const initialState: NewsletterPreferencesActionState = { status: "idle", message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/**
 * Preferencias de newsletter en /cuenta. Hasta este cambio no había
 * ninguna forma de que un cliente ya suscripto cambiara sus intereses o se
 * diera de baja desde el sitio: el único mecanismo posible (reabrir el
 * modal público de alta) se ocultaba automáticamente para los
 * ya-suscriptos, así que quedaba inaccesible en la práctica.
 */
export function NewsletterPreferencesForm({
  interests,
  subscription,
}: {
  interests: NewsletterInterestTag[];
  subscription: NewsletterSubscriber | null;
}) {
  const [state, formAction] = useFormState(updateNewsletterPreferences, initialState);
  const router = useRouter();
  const [isUnsubscribing, startUnsubscribe] = useTransition();
  const [unsubscribeMessage, setUnsubscribeMessage] = useState<string | null>(null);

  const isActive = subscription?.status === "activo";
  const selected = new Set(subscription?.interests ?? []);

  useEffect(() => {
    if (state.status === "success") router.refresh();
  }, [state, router]);

  function handleUnsubscribe() {
    if (!window.confirm("¿Seguro que querés dejar de recibir novedades por email?")) return;
    startUnsubscribe(async () => {
      const result = await unsubscribeCurrentUserFromNewsletter();
      setUnsubscribeMessage(result.message);
      if (result.status === "success") router.refresh();
    });
  }

  return (
    <div className="space-y-5">
      <p className="text-sm text-foreground/70">
        {isActive
          ? "Estás suscripto a las novedades por email."
          : subscription
            ? "Te diste de baja del newsletter — podés volver a suscribirte cuando quieras."
            : "Todavía no estás suscripto a las novedades por email."}
      </p>

      <form action={formAction} className="space-y-5">
        {interests.length > 0 ? (
          <fieldset>
            <legend className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
              Áreas de interés
            </legend>
            <div className="grid grid-cols-2 gap-2">
              {interests.map((interest) => (
                <label key={interest.id} className="flex items-center gap-2 text-sm text-foreground/70">
                  <input
                    type="checkbox"
                    name="interests"
                    value={interest.slug}
                    defaultChecked={selected.has(interest.slug)}
                    className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
                  />
                  {interest.label}
                </label>
              ))}
            </div>
          </fieldset>
        ) : (
          <p className="text-xs text-foreground/40">No hay áreas de interés configuradas todavía.</p>
        )}

        <div className="flex flex-wrap items-center gap-4">
          <SubmitButton label={isActive ? "Guardar preferencias" : "Suscribirme"} />
          {state.status !== "idle" && (
            <p
              role="status"
              aria-live="polite"
              className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}
            >
              {state.message}
            </p>
          )}
        </div>
      </form>

      {isActive && (
        <div className="border-t border-secondary/20 pt-4">
          <button
            type="button"
            onClick={handleUnsubscribe}
            disabled={isUnsubscribing}
            className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isUnsubscribing ? "Procesando..." : "Darme de baja del newsletter"}
          </button>
          {unsubscribeMessage && <p className="mt-2 text-xs text-foreground/50">{unsubscribeMessage}</p>}
        </div>
      )}
    </div>
  );
}
