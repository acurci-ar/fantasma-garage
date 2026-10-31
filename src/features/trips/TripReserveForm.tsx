"use client";

import { useFormState, useFormStatus } from "react-dom";
import { requestTripConsulta, type TripConsultaActionState } from "@/actions/tripConsulta";
import { Button } from "@/components/ui/Button";
import type { TripOptional } from "@/types/trips";

const initialState: TripConsultaActionState = { status: "idle", message: "" };

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="lg" loading={pending} className="w-full">
      {label}
    </Button>
  );
}

export interface TripReserveInitialValues {
  name?: string;
  email?: string;
  phone?: string;
}

/**
 * Llamado a la acción de una travesía: manda una CONSULTA a la bandeja
 * Mensajes (ver actions/tripConsulta.ts). No crea una reserva ni requiere
 * cuenta; el staff crea la reserva desde /admin/reservas. Cuando la reserva
 * queda cargada con el mismo email, la persona la ve en "Mi cuenta".
 */
export function TripReserveForm({
  tripId,
  ctaLabel,
  optionals,
  initialValues,
}: {
  tripId: string;
  ctaLabel: string;
  optionals: TripOptional[];
  initialValues?: TripReserveInitialValues;
}) {
  const [state, formAction] = useFormState(requestTripConsulta, initialState);

  if (state.status === "success") {
    return (
      <div className="rounded-sm border border-primary/40 bg-primary/5 p-6 text-center" role="status" aria-live="polite">
        <p className="font-display text-xl uppercase tracking-tight text-foreground">¡Recibimos tu consulta!</p>
        <p className="mt-2 text-sm text-foreground/70">{state.message}</p>
        <p className="mt-4 text-xs text-foreground/50">
          Cuando confirmemos tu reserva, vas a poder seguir tus pagos y saldo desde “Mi cuenta” (registrándote con
          este mismo email).
        </p>
      </div>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <input type="text" name="company" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />
      <input type="hidden" name="trip_id" value={tripId} />

      <div>
        <label htmlFor="trip-name" className={labelClasses}>Nombre y apellido</label>
        <input id="trip-name" name="name" type="text" required defaultValue={initialValues?.name ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.name} />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="trip-email" className={labelClasses}>Email</label>
          <input id="trip-email" name="email" type="email" required defaultValue={initialValues?.email ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
        <div>
          <label htmlFor="trip-phone" className={labelClasses}>WhatsApp</label>
          <input id="trip-phone" name="phone" type="tel" placeholder="+54 9 11 ..." defaultValue={initialValues?.phone ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.phone} />
        </div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="trip-participants" className={labelClasses}>Participantes</label>
          <select id="trip-participants" name="participants" defaultValue="1" className={inputClasses}>
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <option key={n} value={n}>{n}</option>
            ))}
          </select>
          <FieldError errors={state.fieldErrors?.participants} />
        </div>
        <div>
          <label htmlFor="trip-car" className={labelClasses}>Auto preferido</label>
          <input id="trip-car" name="car_preference" type="text" placeholder="Mustang '69, Camaro, Chevelle..." className={inputClasses} />
        </div>
      </div>

      <label className="flex items-start gap-3 rounded-sm border border-secondary/30 bg-background/40 p-3 text-sm text-foreground/75">
        <input type="checkbox" name="with_copilot" className="mt-0.5 h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary" />
        <span>
          Viajo con copiloto
          <span className="block text-xs text-foreground/45">Comparte el auto y la habitación. Se cotiza aparte.</span>
        </span>
      </label>

      {optionals.length > 0 && (
        <fieldset className="rounded-sm border border-secondary/30 bg-background/40 p-3">
          <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-foreground/60">Me interesa sumar</legend>
          <div className="mt-1 space-y-2">
            {optionals.map((o) => (
              <label key={o.label} className="flex items-start gap-3 text-sm text-foreground/75">
                <input type="checkbox" name="options" value={o.label} className="mt-0.5 h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary" />
                <span>{o.label}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div>
        <label htmlFor="trip-message" className={labelClasses}>Algo más que debamos saber</label>
        <textarea id="trip-message" name="message" rows={2} placeholder="Fechas, dudas, con quién viajás..." className={inputClasses} />
        <FieldError errors={state.fieldErrors?.message} />
      </div>

      <SubmitButton label={ctaLabel} />
      {state.status === "error" && (
        <p role="alert" className="text-sm text-red-400">
          {state.message}
        </p>
      )}
      <p className="text-center text-xs text-foreground/45">
        Sin compromiso: confirmamos disponibilidad, te pasamos el precio y el detalle de pago.
      </p>
    </form>
  );
}
