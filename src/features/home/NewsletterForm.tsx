"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { subscribeNewsletter, getActiveNewsletterInterests, type NewsletterActionState } from "@/actions/newsletter";
import { Button } from "@/components/ui/Button";
import type { NewsletterInterestTag } from "@/types/database";

const initialState: NewsletterActionState = { status: "idle", message: "" };

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      Suscribirme
    </Button>
  );
}

export function NewsletterForm() {
  const [state, formAction] = useFormState(subscribeNewsletter, initialState);
  const [interests, setInterests] = useState<NewsletterInterestTag[]>([]);

  // Los tags se administran desde /admin/newsletter/intereses, así que se
  // traen en vivo en vez de tener una lista fija en el código.
  useEffect(() => {
    getActiveNewsletterInterests().then(setInterests);
  }, []);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label htmlFor="newsletter-email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Email
        </label>
        <input
          id="newsletter-email"
          name="email"
          type="email"
          required
          placeholder="tu@email.com"
          className={inputClasses}
        />
        {state.fieldErrors?.email && (
          <p className="mt-1 text-xs text-primary">{state.fieldErrors.email[0]}</p>
        )}
      </div>

      {interests.length > 0 && (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Áreas de interés (opcional)
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {interests.map((interest) => (
              <label key={interest.id} className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  name="interests"
                  value={interest.slug}
                  className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
                />
                {interest.label}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
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
  );
}
