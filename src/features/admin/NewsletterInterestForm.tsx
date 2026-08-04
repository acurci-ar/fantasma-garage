"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import type { NewsletterInterestActionState } from "@/actions/admin/newsletterInterests";
import type { NewsletterInterestTag } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: NewsletterInterestActionState = { status: "idle", message: "" };

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

export function NewsletterInterestForm({
  action,
  interest,
  submitLabel = "Guardar",
}: {
  action: (state: NewsletterInterestActionState, formData: FormData) => Promise<NewsletterInterestActionState>;
  interest?: NewsletterInterestTag;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <FieldLabel
          htmlFor="label"
          className={labelClasses}
          help="Nombre visible del interés, tal como lo ve el suscriptor en el formulario público."
          example="Chevy Nova"
        >
          Etiqueta
        </FieldLabel>
        <input
          id="label"
          name="label"
          type="text"
          required
          placeholder="Chevy Nova"
          defaultValue={interest?.label ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.label} />
      </div>

      <div>
        <FieldLabel
          htmlFor="slug"
          className={labelClasses}
          help="Identificador interno del interés, en minúsculas y guiones."
          example="chevy-nova"
        >
          Slug
        </FieldLabel>
        <input
          id="slug"
          name="slug"
          type="text"
          required
          placeholder="chevy-nova"
          defaultValue={interest?.slug ?? ""}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-foreground/40">Solo minúsculas, números y guiones. No se puede cambiar después de que haya suscriptores usándolo (mejor crear uno nuevo).</p>
        <FieldError errors={state.fieldErrors?.slug} />
      </div>

      <div>
        <FieldLabel
          htmlFor="sort_order"
          className={labelClasses}
          help="Los números más bajos aparecen primero en el formulario público."
          example="0"
        >
          Orden
        </FieldLabel>
        <input
          id="sort_order"
          name="sort_order"
          type="number"
          min={0}
          defaultValue={interest?.sort_order ?? 0}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-foreground/40">Los números más bajos aparecen primero en el formulario público.</p>
        <FieldError errors={state.fieldErrors?.sort_order} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/70">
        <input
          type="checkbox"
          name="active"
          defaultChecked={interest?.active ?? true}
          className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
        />
        Activo (visible en el formulario público)
      </label>

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
