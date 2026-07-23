"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { changePassword, type ChangePasswordActionState } from "@/actions/account";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ChangePasswordActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Cambiar contraseña
    </Button>
  );
}

/** Form de cambio de contraseña, para cualquier usuario logueado (cliente en /cuenta, staff en /admin/configuracion). */
export function ChangePasswordForm() {
  const [state, formAction] = useFormState(changePassword, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") formRef.current?.reset();
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div>
        <label htmlFor="current_password" className={labelClasses}>
          Contraseña actual
        </label>
        <input
          id="current_password"
          name="current_password"
          type="password"
          autoComplete="current-password"
          required
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.current_password} />
      </div>

      <div>
        <label htmlFor="new_password" className={labelClasses}>
          Nueva contraseña
        </label>
        <input
          id="new_password"
          name="new_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-foreground/40">Mínimo 8 caracteres.</p>
        <FieldError errors={state.fieldErrors?.new_password} />
      </div>

      <div>
        <label htmlFor="confirm_password" className={labelClasses}>
          Repetir nueva contraseña
        </label>
        <input
          id="confirm_password"
          name="confirm_password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.confirm_password} />
      </div>

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
