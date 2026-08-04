"use client";

import { useFormState, useFormStatus } from "react-dom";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { requestPasswordReset, type RequestPasswordResetActionState } from "@/actions/account";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const initialState: RequestPasswordResetActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full">
      Enviar link de recuperación
    </Button>
  );
}

/** Pide el email de recuperación de contraseña. Ver requestPasswordReset (actions/account.ts) sobre por qué el mensaje de éxito no confirma si el email existe. */
export function RequestPasswordResetForm() {
  const [state, formAction] = useFormState(requestPasswordReset, initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div>
        <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Email
        </label>
        <input id="email" name="email" type="email" required autoComplete="email" className={inputClasses} />
        <FieldError errors={state.fieldErrors?.email} />
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

      <p className="text-center text-sm text-foreground/50">
        <Link href="/login" className="text-primary hover:underline">
          Volver a iniciar sesión
        </Link>
      </p>
    </form>
  );
}
