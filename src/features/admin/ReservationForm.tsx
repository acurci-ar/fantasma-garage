"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { optionsToLines } from "@/lib/validation/admin/reservation";
import type { ReservationActionState } from "@/actions/admin/reservations";
import { TRIP_RESERVATION_STATUS_LABEL, type TripReservation, type TripReservationStatus } from "@/types/trips";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";
const initialState: ReservationActionState = { status: "idle", message: "" };

const STATUSES: TripReservationStatus[] = ["solicitada", "lista_espera", "confirmada", "senada", "pagada", "cancelada"];

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

export function ReservationForm({
  action,
  trips,
  reservation,
  submitLabel = "Guardar",
}: {
  action: (state: ReservationActionState, formData: FormData) => Promise<ReservationActionState>;
  trips: { id: string; title: string }[];
  reservation?: TripReservation;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success" && state.id && !reservation) {
      router.push(`/admin/reservas/${state.id}`);
    }
  }, [state, reservation, router]);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div>
        <FieldLabel htmlFor="trip_id" className={labelClasses} help="Travesía que reserva el cliente.">Travesía</FieldLabel>
        <select id="trip_id" name="trip_id" required defaultValue={reservation?.trip_id ?? ""} className={inputClasses}>
          <option value="" disabled>
            Elegí una travesía…
          </option>
          {trips.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
        <FieldError errors={state.fieldErrors?.trip_id} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel htmlFor="full_name" className={labelClasses}>Nombre del cliente</FieldLabel>
          <input id="full_name" name="full_name" type="text" required defaultValue={reservation?.full_name ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.full_name} />
        </div>
        <div>
          <FieldLabel htmlFor="email" className={labelClasses} help="Con este email el cliente ve su reserva en “Mi cuenta” (registrándose con el mismo email).">
            Email
          </FieldLabel>
          <input id="email" name="email" type="email" required defaultValue={reservation?.email ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.email} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="phone" className={labelClasses}>WhatsApp / teléfono</FieldLabel>
          <input id="phone" name="phone" type="tel" defaultValue={reservation?.phone ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel htmlFor="participants" className={labelClasses}>Participantes</FieldLabel>
          <input id="participants" name="participants" type="number" min={1} defaultValue={reservation?.participants ?? 1} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.participants} />
        </div>
        <div>
          <FieldLabel htmlFor="car_preference" className={labelClasses}>Auto preferido</FieldLabel>
          <input id="car_preference" name="car_preference" type="text" defaultValue={reservation?.car_preference ?? ""} className={inputClasses} />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/70">
        <input
          type="checkbox"
          name="with_copilot"
          defaultChecked={reservation?.with_copilot ?? false}
          className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
        />
        Viaja con copiloto
      </label>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="status" className={labelClasses}>Estado</FieldLabel>
          <select id="status" name="status" defaultValue={reservation?.status ?? "solicitada"} className={inputClasses}>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {TRIP_RESERVATION_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel htmlFor="total_amount" className={labelClasses} help="Total acordado de la reserva (precio por persona × participantes, o lo que se pacte).">
            Total acordado
          </FieldLabel>
          <input id="total_amount" name="total_amount" type="number" min={0} step="0.01" defaultValue={reservation?.total_amount ?? 0} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.total_amount} />
        </div>
        <div>
          <FieldLabel htmlFor="currency" className={labelClasses}>Moneda</FieldLabel>
          <select id="currency" name="currency" defaultValue={reservation?.currency ?? "USD"} className={inputClasses}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>
      </div>

      <div>
        <FieldLabel htmlFor="options" className={labelClasses} help="Opcionales/extras acordados. Una línea por ítem. Formato: Etiqueta | precio" example="Upgrade business | 3300">
          Opcionales acordados
        </FieldLabel>
        <textarea id="options" name="options" rows={3} defaultValue={optionsToLines(reservation?.options)} className={inputClasses} />
      </div>

      <div>
        <FieldLabel htmlFor="public_notes" className={labelClasses} help="Visibles para el cliente en “Mi cuenta” (confirmaciones, próximos pasos, qué incluye su reserva).">
          Notas públicas (las ve el cliente)
        </FieldLabel>
        <textarea id="public_notes" name="public_notes" rows={3} defaultValue={reservation?.public_notes ?? ""} className={inputClasses} />
      </div>

      <div>
        <FieldLabel htmlFor="admin_notes" className={labelClasses} help="Solo para el staff. El cliente nunca las ve.">
          Notas internas (privadas)
        </FieldLabel>
        <textarea id="admin_notes" name="admin_notes" rows={3} defaultValue={reservation?.admin_notes ?? ""} className={inputClasses} />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
        {state.status !== "idle" && (
          <p role="status" aria-live="polite" className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
