"use client";

import { useFormState, useFormStatus } from "react-dom";
import { submitContactForm, type ContactActionState } from "@/actions/contact";
import { Button } from "@/components/ui/Button";

const initialState: ContactActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} className="w-full sm:w-auto">
      Enviar mensaje
    </Button>
  );
}

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

export interface ContactFormInitialValues {
  name?: string;
  email?: string;
  phone?: string;
}

export function ContactForm({ initialValues }: { initialValues?: ContactFormInitialValues } = {}) {
  const [state, formAction] = useFormState(submitContactForm, initialState);

  return (
    <form action={formAction} className="space-y-5" noValidate>
      {/* Honeypot anti-spam, oculto para personas, visible para bots */}
      <input
        type="text"
        name="company"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] h-0 w-0 opacity-0"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Nombre
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            defaultValue={initialValues?.name ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.name} />
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            defaultValue={initialValues?.email ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
      </div>

      <div>
        <label htmlFor="phone" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Teléfono (opcional)
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          defaultValue={initialValues?.phone ?? ""}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="subject" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Motivo
        </label>
        <input id="subject" name="subject" type="text" required className={inputClasses} />
        <FieldError errors={state.fieldErrors?.subject} />
      </div>

      <div>
        <label htmlFor="message" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Mensaje
        </label>
        <textarea id="message" name="message" rows={5} required className={inputClasses} />
        <FieldError errors={state.fieldErrors?.message} />
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
