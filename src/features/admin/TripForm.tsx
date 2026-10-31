"use client";

import { useEffect } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { TripActionState } from "@/actions/admin/trips";
import { highlightsToLines, optionalsToLines, toLines } from "@/lib/validation/admin/trip";
import type { Trip } from "@/types/trips";

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

function Fieldset({ title, hint, children }: { title: string; hint?: string; children: React.ReactNode }) {
  return (
    <fieldset className="rounded-sm border border-secondary/30 p-5">
      <legend className="px-2 font-display text-sm uppercase tracking-wide text-foreground/80">{title}</legend>
      {hint && <p className="mb-4 text-xs text-foreground/50">{hint}</p>}
      <div className="space-y-5">{children}</div>
    </fieldset>
  );
}

export function TripForm({
  action,
  trip,
  submitLabel = "Guardar",
}: {
  action: (state: TripActionState, formData: FormData) => Promise<TripActionState>;
  trip?: Trip;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const router = useRouter();

  // Al crear, saltamos a la edición para cargar los días.
  useEffect(() => {
    if (state.status === "success" && state.id && !trip) {
      router.push(`/admin/travesias/${state.id}`);
    }
  }, [state, trip, router]);

  return (
    <form action={formAction} className="max-w-3xl space-y-8">
      <Fieldset title="Identidad">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="title" className={labelClasses} help="Nombre visible de la travesía." example="Travesía Ruta 66">
              Título
            </FieldLabel>
            <input id="title" name="title" type="text" required defaultValue={trip?.title ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.title} />
          </div>
          <div>
            <FieldLabel htmlFor="slug" className={labelClasses} help="Parte final de la URL pública: /travesias/<slug>." example="ruta-66">
              Slug (URL)
            </FieldLabel>
            <input id="slug" name="slug" type="text" required defaultValue={trip?.slug ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.slug} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="eyebrow" className={labelClasses} help="Texto chico arriba del título en el hero." example="SEMA Show 2027 · 4 al 11 de noviembre">
              Antetítulo
            </FieldLabel>
            <input id="eyebrow" name="eyebrow" type="text" defaultValue={trip?.eyebrow ?? ""} className={inputClasses} />
          </div>
          <div>
            <FieldLabel htmlFor="subtitle" className={labelClasses} help="Línea debajo del título: las paradas principales." example="Las Vegas · Hoover Dam · Ruta 66 · Gran Cañón">
              Subtítulo
            </FieldLabel>
            <input id="subtitle" name="subtitle" type="text" defaultValue={trip?.subtitle ?? ""} className={inputClasses} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="summary" className={labelClasses} help="Dos o tres líneas que venden el viaje. Se usa en el hero y en el listado.">
            Resumen
          </FieldLabel>
          <textarea id="summary" name="summary" rows={3} required defaultValue={trip?.summary ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.summary} />
        </div>
        <div>
          <FieldLabel htmlFor="description" className={labelClasses} help="Texto largo del bloque 'La travesía'. Opcional.">
            Descripción
          </FieldLabel>
          <textarea id="description" name="description" rows={6} defaultValue={trip?.description ?? ""} className={inputClasses} />
        </div>
      </Fieldset>

      <Fieldset title="Publicación">
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="status" className={labelClasses} help="Borrador y oculta no se ven en el sitio (el staff sí las puede previsualizar).">
              Estado
            </FieldLabel>
            <select id="status" name="status" defaultValue={trip?.status ?? "draft"} className={inputClasses}>
              <option value="draft">Borrador</option>
              <option value="published">Publicada</option>
              <option value="hidden">Oculta</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="position" className={labelClasses} help="Orden en el listado: menor primero." example="0">
              Orden
            </FieldLabel>
            <input id="position" name="position" type="number" min={0} defaultValue={trip?.position ?? 0} className={inputClasses} />
          </div>
          <label className="flex items-center gap-2 self-end pb-3 text-sm text-foreground/70">
            <input
              type="checkbox"
              name="show_price"
              defaultChecked={trip?.show_price ?? false}
              className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
            />
            Mostrar el precio en la página
          </label>
        </div>
        <p className="text-xs text-foreground/45">
          Si está <strong>publicada</strong>, la travesía aparece en la sección Travesías del sitio (que a su vez se
          activa o desactiva en general desde Configuración). Por defecto el <strong>precio no se muestra</strong> en
          la página: se informa al consultar. Activá “Mostrar el precio” solo si querés publicarlo.
        </p>
      </Fieldset>

      <Fieldset title="Fechas, precio y cupos">
        <div className="grid gap-5 sm:grid-cols-3">
          <div>
            <FieldLabel htmlFor="start_date" className={labelClasses} help="Día de llegada." example="2027-11-04">Inicio</FieldLabel>
            <input id="start_date" name="start_date" type="date" defaultValue={trip?.start_date ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.start_date} />
          </div>
          <div>
            <FieldLabel htmlFor="end_date" className={labelClasses} help="Día de regreso." example="2027-11-11">Fin</FieldLabel>
            <input id="end_date" name="end_date" type="date" defaultValue={trip?.end_date ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.end_date} />
          </div>
          <div>
            <FieldLabel htmlFor="duration_label" className={labelClasses} help="Texto libre de duración." example="7 noches · 8 días">Duración</FieldLabel>
            <input id="duration_label" name="duration_label" type="text" defaultValue={trip?.duration_label ?? ""} className={inputClasses} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-4">
          <div className="sm:col-span-1">
            <FieldLabel htmlFor="price" className={labelClasses} help="Precio por persona. Vacío = 'Precio a confirmar'." example="30000">Precio</FieldLabel>
            <input id="price" name="price" type="number" min={0} step="1" defaultValue={trip?.price ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.price} />
          </div>
          <div>
            <FieldLabel htmlFor="currency" className={labelClasses}>Moneda</FieldLabel>
            <select id="currency" name="currency" defaultValue={trip?.currency ?? "USD"} className={inputClasses}>
              <option value="USD">USD</option>
              <option value="ARS">ARS</option>
            </select>
          </div>
          <div>
            <FieldLabel htmlFor="min_participants" className={labelClasses} example="5">Mín. participantes</FieldLabel>
            <input id="min_participants" name="min_participants" type="number" min={0} defaultValue={trip?.min_participants ?? ""} className={inputClasses} />
          </div>
          <div>
            <FieldLabel htmlFor="max_participants" className={labelClasses} example="15">Máx. participantes</FieldLabel>
            <input id="max_participants" name="max_participants" type="number" min={0} defaultValue={trip?.max_participants ?? ""} className={inputClasses} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="price_note" className={labelClasses} help="Aclaración debajo del precio." example="Por persona, con auto clásico propio y vuelo incluido.">
            Nota de precio
          </FieldLabel>
          <input id="price_note" name="price_note" type="text" defaultValue={trip?.price_note ?? ""} className={inputClasses} />
        </div>
      </Fieldset>

      <Fieldset title="Portada">
        <ImageUploadField fileFieldName="cover_file" urlFieldName="cover_url" initialUrl={trip?.cover_url} urlFieldErrors={state.fieldErrors?.cover_url} />
        <div>
          <FieldLabel htmlFor="cover_credit" className={labelClasses} help="Crédito de la foto (se muestra chico en el hero)." example="Brendan Stephens · Unsplash">
            Crédito de la portada
          </FieldLabel>
          <input id="cover_credit" name="cover_credit" type="text" defaultValue={trip?.cover_credit ?? ""} className={inputClasses} />
        </div>
      </Fieldset>

      <Fieldset title="Contenido" hint="Una línea por ítem. Para los campos con varias partes, separalas con una barra vertical ( | ).">
        <div>
          <FieldLabel htmlFor="highlights" className={labelClasses} help="Los 3–4 argumentos de venta del bloque 'La travesía'. Formato: Etiqueta | detalle" example="Ruta 66 original | Oatman, Kingman, Seligman y Williams.">
            Destacados
          </FieldLabel>
          <textarea id="highlights" name="highlights" rows={4} defaultValue={highlightsToLines(trip?.highlights)} className={inputClasses} />
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="includes" className={labelClasses} help="Lista de 'Qué incluye'.">Incluye</FieldLabel>
            <textarea id="includes" name="includes" rows={10} defaultValue={toLines(trip?.includes)} className={inputClasses} />
          </div>
          <div>
            <FieldLabel htmlFor="excludes" className={labelClasses} help="Lista de 'No incluye'.">No incluye</FieldLabel>
            <textarea id="excludes" name="excludes" rows={10} defaultValue={toLines(trip?.excludes)} className={inputClasses} />
          </div>
        </div>
        <div>
          <FieldLabel htmlFor="optionals" className={labelClasses} help="Extras que se venden aparte. Formato: Etiqueta | precio" example="Cirque du Soleil “O” | USD 300">
            Opcionales
          </FieldLabel>
          <textarea id="optionals" name="optionals" rows={3} defaultValue={optionalsToLines(trip?.optionals)} className={inputClasses} />
        </div>
        <p className="text-xs text-foreground/45">
          El mapa del recorrido se arma con el lugar geográfico de cada día. Cargá ese lugar (nombre y coordenadas)
          en cada día del itinerario, abajo.
        </p>
      </Fieldset>

      <Fieldset title="Llamado a la acción y SEO">
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="cta_label" className={labelClasses} example="Quiero mi lugar">Texto del botón</FieldLabel>
            <input id="cta_label" name="cta_label" type="text" defaultValue={trip?.cta_label ?? ""} className={inputClasses} />
          </div>
          <div>
            <FieldLabel htmlFor="cta_url" className={labelClasses} help="Si lo dejás vacío, el botón abre el formulario de reserva del sitio (llega a Mensajes). Si ponés una URL (ej. link de pago), el botón lleva ahí.">
              URL externa del botón (opcional)
            </FieldLabel>
            <input id="cta_url" name="cta_url" type="url" defaultValue={trip?.cta_url ?? ""} className={inputClasses} />
            <FieldError errors={state.fieldErrors?.cta_url} />
          </div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <FieldLabel htmlFor="seo_title" className={labelClasses}>Título SEO</FieldLabel>
            <input id="seo_title" name="seo_title" type="text" defaultValue={trip?.seo_title ?? ""} className={inputClasses} />
          </div>
          <div>
            <FieldLabel htmlFor="seo_description" className={labelClasses}>Descripción SEO</FieldLabel>
            <input id="seo_description" name="seo_description" type="text" defaultValue={trip?.seo_description ?? ""} className={inputClasses} />
          </div>
        </div>
      </Fieldset>

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
