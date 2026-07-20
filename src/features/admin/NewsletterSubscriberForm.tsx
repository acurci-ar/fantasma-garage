"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { NewsletterSubscriberActionState } from "@/actions/admin/newsletterSubscribers";
import type { NewsletterInterestTag, NewsletterSubscriber } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: NewsletterSubscriberActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

export function NewsletterSubscriberForm({
  action,
  allInterests,
  subscriber,
  submitLabel = "Guardar",
}: {
  action: (state: NewsletterSubscriberActionState, formData: FormData) => Promise<NewsletterSubscriberActionState>;
  allInterests: NewsletterInterestTag[];
  subscriber?: NewsletterSubscriber;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const selected = new Set(subscriber?.interests ?? []);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <label htmlFor="email" className={labelClasses}>
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          defaultValue={subscriber?.email ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.email} />
      </div>

      <div>
        <label htmlFor="status" className={labelClasses}>
          Estado
        </label>
        <select id="status" name="status" defaultValue={subscriber?.status ?? "activo"} className={inputClasses}>
          <option value="activo">Activo</option>
          <option value="baja">Baja</option>
        </select>
      </div>

      {allInterests.length > 0 && (
        <fieldset>
          <legend className={labelClasses}>Intereses</legend>
          <div className="grid grid-cols-2 gap-2">
            {allInterests.map((interest) => (
              <label key={interest.id} className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  name="interests"
                  value={interest.slug}
                  defaultChecked={selected.has(interest.slug)}
                  className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
                />
                {interest.label}
                {!interest.active && <span className="text-xs text-foreground/40"> (inactivo)</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
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
