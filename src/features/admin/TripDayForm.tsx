"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { TripActionState } from "@/actions/admin/trips";
import { toLines } from "@/lib/validation/admin/trip";
import type { TripDay } from "@/types/trips";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";
const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";
const initialState: TripActionState = { status: "idle", message: "" };

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

export function TripDayForm({
  action,
  day,
  nextPosition = 0,
  submitLabel = "Guardar",
}: {
  action: (state: TripActionState, formData: FormData) => Promise<TripActionState>;
  day?: TripDay;
  nextPosition?: number;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="max-w-3xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="day_label" className={labelClasses} help="Etiqueta corta del día." example="Día 2">Etiqueta</FieldLabel>
          <input id="day_label" name="day_label" type="text" required defaultValue={day?.day_label ?? `Día ${nextPosition}`} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.day_label} />
        </div>
        <div>
          <FieldLabel htmlFor="date_label" className={labelClasses} help="Fecha en texto, como se muestra." example="sáb 6 nov">Fecha</FieldLabel>
          <input id="date_label" name="date_label" type="text" defaultValue={day?.date_label ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel htmlFor="position" className={labelClasses} help="Orden dentro del itinerario (menor primero)." example="2">Orden</FieldLabel>
          <input id="position" name="position" type="number" min={0} defaultValue={day?.position ?? nextPosition} className={inputClasses} />
        </div>
      </div>
      <div>
        <FieldLabel htmlFor="title" className={labelClasses} example="Tu clásico te espera en Fremont Street">Título del día</FieldLabel>
        <input id="title" name="title" type="text" required defaultValue={day?.title ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.title} />
      </div>
      <div>
        <FieldLabel htmlFor="description" className={labelClasses} help="Relato del día, en tono de invitación.">Descripción</FieldLabel>
        <textarea id="description" name="description" rows={5} required defaultValue={day?.description ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.description} />
      </div>
      <div>
        <FieldLabel htmlFor="highlights" className={labelClasses} help="Una actividad por línea; se muestran como viñetas.">Actividades destacadas</FieldLabel>
        <textarea id="highlights" name="highlights" rows={4} defaultValue={toLines(day?.highlights)} className={inputClasses} />
      </div>
      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="lodging" className={labelClasses} example="El Tovar Hotel">Alojamiento</FieldLabel>
          <input id="lodging" name="lodging" type="text" defaultValue={day?.lodging ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel htmlFor="meals" className={labelClasses} example="Desayuno · Almuerzo · Cena">Comidas</FieldLabel>
          <input id="meals" name="meals" type="text" defaultValue={day?.meals ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel htmlFor="distance_km" className={labelClasses} help="Kilómetros al volante ese día. Vacío si no se maneja." example="420">Km</FieldLabel>
          <input id="distance_km" name="distance_km" type="number" min={0} defaultValue={day?.distance_km ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.distance_km} />
        </div>
      </div>

      <fieldset className="rounded-sm border border-secondary/30 p-5">
        <legend className="px-2 font-display text-sm uppercase tracking-wide text-foreground/80">Lugar en el mapa</legend>
        <p className="mb-4 text-xs text-foreground/50">
          El mapa del recorrido usa un punto por día. Si cargás el lugar y sus coordenadas, este día aparece en el
          mapa. Dejalo vacío para que el día no figure como parada (ej. un día que no se mueve de la ciudad).
          Tip: buscá el lugar en Google Maps, click derecho sobre el pin y copiá las coordenadas.
        </p>
        <div className="grid gap-5 sm:grid-cols-4">
          <div className="sm:col-span-2">
            <FieldLabel htmlFor="place_name" className={labelClasses} help="Nombre del lugar como se muestra en el mapa." example="Gran Cañón · borde sur">
              Lugar
            </FieldLabel>
            <input id="place_name" name="place_name" type="text" defaultValue={day?.place_name ?? ""} className={inputClasses} />
          </div>
          <div>
            <FieldLabel htmlFor="place_lat" className={labelClasses} example="36.0544">Latitud</FieldLabel>
            <input id="place_lat" name="place_lat" type="text" inputMode="decimal" defaultValue={day?.place_lat ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.place_lat} />
          </div>
          <div>
            <FieldLabel htmlFor="place_lng" className={labelClasses} example="-112.1401">Longitud</FieldLabel>
            <input id="place_lng" name="place_lng" type="text" inputMode="decimal" defaultValue={day?.place_lng ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.place_lng} />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-sm border border-secondary/30 p-5">
        <legend className="px-2 font-display text-sm uppercase tracking-wide text-foreground/80">Foto principal</legend>
        <div className="space-y-5">
          <ImageUploadField fileFieldName="image_file" urlFieldName="image_url" initialUrl={day?.image_url ?? undefined} />
          <div>
            <FieldLabel htmlFor="image_credit" className={labelClasses} example="Fabio Sasso · Unsplash">Crédito</FieldLabel>
            <input id="image_credit" name="image_credit" type="text" defaultValue={day?.image_credit ?? ""} className={inputClasses} />
          </div>
        </div>
      </fieldset>

      <fieldset className="rounded-sm border border-secondary/30 p-5">
        <legend className="px-2 font-display text-sm uppercase tracking-wide text-foreground/80">Foto secundaria (opcional)</legend>
        <div className="space-y-5">
          <ImageUploadField fileFieldName="secondary_image_file" urlFieldName="secondary_image_url" initialUrl={day?.secondary_image_url ?? undefined} />
          <div>
            <FieldLabel htmlFor="secondary_image_credit" className={labelClasses}>Crédito</FieldLabel>
            <input id="secondary_image_credit" name="secondary_image_credit" type="text" defaultValue={day?.secondary_image_credit ?? ""} className={inputClasses} />
          </div>
        </div>
      </fieldset>

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
