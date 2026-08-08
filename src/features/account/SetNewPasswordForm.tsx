"use client";

import { useEffect, useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { PasswordInput } from "@/components/ui/PasswordInput";
import { setNewPasswordAfterRecovery, type SetNewPasswordActionState } from "@/actions/account";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: SetNewPasswordActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Guardar nueva contraseña
    </Button>
  );
}

/**
 * Form de /cuenta/nueva-contrasena: ya requiere sesión (la ruta cae bajo
 * el matcher /cuenta/:path* del middleware), que en este caso viene de
 * haber tocado el link de recuperación, no de un login normal.
 */
export function SetNewPasswordForm() {
  const [state, formAction] = useFormState(setNewPasswordAfterRecovery, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    const timeout = setTimeout(() => router.push("/cuenta"), 1500);
    return () => clearTimeout(timeout);
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className="space-y-5">
      <div>
        <label htmlFor="new_password" className={labelClasses}>
          Nueva contraseña
        </label>
        <PasswordInput
          id="new_password"
          name="new_password"
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
        <PasswordInput
          id="confirm_password"
          name="confirm_password"
          autoComplete="new-password"
          minLength={8}
          required
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.confirm_password} />
      </div>

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
    </form>
  );
}
