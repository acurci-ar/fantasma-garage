"use client";

import { useRef } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { addPayment, type ReservationActionState } from "@/actions/admin/reservations";
import { TRIP_PAYMENT_METHOD_LABEL, type TripPaymentMethod } from "@/types/trips";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";
const initialState: ReservationActionState = { status: "idle", message: "" };

const METHODS: TripPaymentMethod[] = ["transferencia", "tarjeta", "efectivo", "cripto", "otro"];

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Registrar pago
    </Button>
  );
}

export function PaymentForm({ reservationId, currency }: { reservationId: string; currency: "USD" | "ARS" }) {
  const action = addPayment.bind(null, reservationId);
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);

  // Al registrar un pago con éxito, limpiamos el formulario para cargar el siguiente.
  if (state.status === "success" && formRef.current) {
    formRef.current.reset();
  }

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="amount" className={labelClasses}>Monto</FieldLabel>
          <input id="amount" name="amount" type="number" min={0} step="0.01" required className={inputClasses} />
          <FieldError errors={state.fieldErrors?.amount} />
        </div>
        <div>
          <FieldLabel htmlFor="pay_currency" className={labelClasses}>Moneda</FieldLabel>
          <select id="pay_currency" name="currency" defaultValue={currency} className={inputClasses}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="method" className={labelClasses}>Medio</FieldLabel>
          <select id="method" name="method" defaultValue="transferencia" className={inputClasses}>
            {METHODS.map((m) => (
              <option key={m} value={m}>
                {TRIP_PAYMENT_METHOD_LABEL[m]}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="paid_at" className={labelClasses}>Fecha</FieldLabel>
          <input id="paid_at" name="paid_at" type="date" defaultValue={today} required className={inputClasses} />
          <FieldError errors={state.fieldErrors?.paid_at} />
        </div>
        <div className="sm:col-span-2">
          <FieldLabel htmlFor="reference" className={labelClasses} help="Nº de comprobante, operación o lo que sirva para identificar el pago.">
            Referencia
          </FieldLabel>
          <input id="reference" name="reference" type="text" className={inputClasses} />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="note" className={labelClasses}>Nota</FieldLabel>
        <input id="note" name="note" type="text" className={inputClasses} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status !== "idle" && (
          <p role="status" aria-live="polite" className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
