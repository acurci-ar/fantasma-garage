"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import { slugify } from "@/lib/utils/format";
import type { Car } from "@/types/database";
import type { CarActionState } from "@/actions/admin/cars";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: CarActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} size="lg">
      {label}
    </Button>
  );
}

/** ISO -> valor para <input type="datetime-local"> (en hora local del navegador, sin segundos). */
function toDatetimeLocalValue(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function CarForm({
  action,
  car,
  submitLabel,
}: {
  action: (prevState: CarActionState, formData: FormData) => Promise<CarActionState>;
  car?: Car;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [slugTouched, setSlugTouched] = useState(Boolean(car));
  const [title, setTitle] = useState(car?.title ?? "");
  const [slug, setSlug] = useState(car?.slug ?? "");

  useEffect(() => {
    if (!slugTouched) setSlug(slugify(title));
  }, [title, slugTouched]);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="title"
            className={labelClasses}
            help="Nombre interno para identificar este auto en el admin (no es necesariamente lo que ve el cliente)."
            example="Chevy Nova SS 1972"
          >
            Título interno
          </FieldLabel>
          <input
            id="title"
            name="title"
            type="text"
            required
            placeholder="Chevy Nova SS 1972"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.title} />
        </div>
        <div>
          <FieldLabel
            htmlFor="slug"
            className={labelClasses}
            help="La parte final de la URL de la ficha pública. Se autocompleta desde el título; podés editarla."
            example="chevy-nova-ss-1972"
          >
            Slug (URL)
          </FieldLabel>
          <input
            id="slug"
            name="slug"
            type="text"
            required
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.slug} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="make" className={labelClasses} help="Fabricante del vehículo." example="Chevrolet">
            Marca
          </FieldLabel>
          <input id="make" name="make" type="text" required defaultValue={car?.make ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.make} />
        </div>
        <div>
          <FieldLabel htmlFor="model" className={labelClasses} help="Modelo del vehículo." example="Nova SS">
            Modelo
          </FieldLabel>
          <input id="model" name="model" type="text" required defaultValue={car?.model ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.model} />
        </div>
        <div>
          <FieldLabel htmlFor="year" className={labelClasses} help="Año de fabricación del vehículo." example="1972">
            Año
          </FieldLabel>
          <input
            id="year"
            name="year"
            type="number"
            min={1900}
            max={2100}
            required
            defaultValue={car?.year ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.year} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel
            htmlFor="price"
            className={labelClasses}
            help="Precio de venta. Si lo dejás vacío, la ficha pública muestra 'Consultar precio' en su lugar."
            example="45000"
          >
            Precio (opcional — vacío = &quot;Consultar&quot;)
          </FieldLabel>
          <input
            id="price"
            name="price"
            type="number"
            min="0"
            step="0.01"
            defaultValue={car?.price ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.price} />
        </div>
        <div>
          <FieldLabel htmlFor="currency" className={labelClasses} help="En qué moneda se expresa el precio.">
            Moneda
          </FieldLabel>
          <select id="currency" name="currency" defaultValue={car?.currency ?? "USD"} className={inputClasses}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>
        <div>
          <FieldLabel
            htmlFor="mileage_km"
            className={labelClasses}
            help="Kilometraje del vehículo, si se conoce."
            example="85000"
          >
            Kilometraje (opcional)
          </FieldLabel>
          <input
            id="mileage_km"
            name="mileage_km"
            type="number"
            min="0"
            step="1"
            defaultValue={car?.mileage_km ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.mileage_km} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="engine" className={labelClasses} help="Motorización del vehículo." example="V8 350ci">
            Motor (opcional)
          </FieldLabel>
          <input id="engine" name="engine" type="text" defaultValue={car?.engine ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel htmlFor="transmission" className={labelClasses} help="Tipo de caja de cambios." example="Manual 4 velocidades">
            Caja (opcional)
          </FieldLabel>
          <input
            id="transmission"
            name="transmission"
            type="text"
            defaultValue={car?.transmission ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <FieldLabel htmlFor="color" className={labelClasses} help="Color exterior del vehículo." example="Azul Lemans">
            Color (opcional)
          </FieldLabel>
          <input id="color" name="color" type="text" defaultValue={car?.color ?? ""} className={inputClasses} />
        </div>
      </div>

      <div>
        <FieldLabel
          htmlFor="summary"
          className={labelClasses}
          help="Frase corta que se ve en la tarjeta del auto, en /autos y en la home."
          example="Restaurado a nuevo, motor original, service al día."
        >
          Resumen (se ve en la tarjeta de /autos)
        </FieldLabel>
        <input id="summary" name="summary" type="text" required defaultValue={car?.summary ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.summary} />
      </div>

      <div>
        <FieldLabel
          htmlFor="description"
          className={labelClasses}
          help="Texto completo de la ficha pública del auto, con toda la historia y detalles."
          example="Nova SS adquirido en 2019, restauración integral en 2022, motor reconstruido..."
        >
          Descripción completa (ficha del auto)
        </FieldLabel>
        <textarea id="description" name="description" rows={6} defaultValue={car?.description ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="status" className={labelClasses} help="Controla si el auto es visible en /autos.">
            Estado
          </FieldLabel>
          <select id="status" name="status" defaultValue={car?.status ?? "draft"} className={inputClasses}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="hidden">Oculto</option>
            <option value="discontinued">Vendido</option>
          </select>
        </div>
        <div>
          <FieldLabel
            htmlFor="published_from"
            className={labelClasses}
            help="A partir de esta fecha el auto empieza a mostrarse en /autos (aunque el estado ya sea Publicado)."
            example="10/08/2026 09:00"
          >
            Vigente desde (opcional)
          </FieldLabel>
          <input
            id="published_from"
            name="published_from"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(car?.published_from ?? null)}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.published_from} />
        </div>
        <div>
          <FieldLabel
            htmlFor="published_until"
            className={labelClasses}
            help="A partir de esta fecha el auto deja de mostrarse en /autos, aunque siga en estado Publicado."
            example="30/09/2026 23:59"
          >
            Vigente hasta (opcional)
          </FieldLabel>
          <input
            id="published_until"
            name="published_until"
            type="datetime-local"
            defaultValue={toDatetimeLocalValue(car?.published_until ?? null)}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.published_until} />
        </div>
      </div>
      <p className="-mt-3 text-xs text-foreground/40">
        Fuera de esta ventana, el auto no aparece en /autos aunque el estado sea &quot;Publicado&quot;. Dejar vacío = sin
        límite.
      </p>

      <div className="space-y-5 rounded-sm border border-secondary/30 p-5">
        <p className={labelClasses}>Foto de portada</p>
        <ImageUploadField
          fileFieldName="cover_file"
          urlFieldName="cover_url"
          initialUrl={car?.cover_url}
          urlFieldErrors={state.fieldErrors?.cover_url}
        />
      </div>

      {!car && (
        <p className="rounded-sm border border-secondary/30 bg-card/40 p-4 text-xs text-foreground/50">
          Las fotos adicionales y los videos se cargan después de crear el auto (próxima pantalla).
        </p>
      )}

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="seo_title"
            className={labelClasses}
            help="Título que usan los buscadores (Google) y al compartir el link. Si lo dejás vacío, se usa marca + modelo + año."
            example="Chevy Nova SS 1972 restaurado — Fantasma Garage"
          >
            SEO: título (opcional)
          </FieldLabel>
          <input id="seo_title" name="seo_title" type="text" defaultValue={car?.seo_title ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel
            htmlFor="seo_description"
            className={labelClasses}
            help="Texto que aparece debajo del título en los resultados de Google y al compartir el link."
            example="Chevy Nova SS 1972 restaurado a nuevo, motor original, listo para su próximo dueño."
          >
            SEO: descripción (opcional)
          </FieldLabel>
          <input
            id="seo_description"
            name="seo_description"
            type="text"
            defaultValue={car?.seo_description ?? ""}
            className={inputClasses}
          />
        </div>
      </div>

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
