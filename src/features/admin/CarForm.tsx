"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
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
          <label htmlFor="title" className={labelClasses}>
            Título interno
          </label>
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
          <label htmlFor="slug" className={labelClasses}>
            Slug (URL)
          </label>
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
          <label htmlFor="make" className={labelClasses}>
            Marca
          </label>
          <input id="make" name="make" type="text" required defaultValue={car?.make ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.make} />
        </div>
        <div>
          <label htmlFor="model" className={labelClasses}>
            Modelo
          </label>
          <input id="model" name="model" type="text" required defaultValue={car?.model ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.model} />
        </div>
        <div>
          <label htmlFor="year" className={labelClasses}>
            Año
          </label>
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
          <label htmlFor="price" className={labelClasses}>
            Precio (opcional — vacío = &quot;Consultar&quot;)
          </label>
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
          <label htmlFor="currency" className={labelClasses}>
            Moneda
          </label>
          <select id="currency" name="currency" defaultValue={car?.currency ?? "USD"} className={inputClasses}>
            <option value="USD">USD</option>
            <option value="ARS">ARS</option>
          </select>
        </div>
        <div>
          <label htmlFor="mileage_km" className={labelClasses}>
            Kilometraje (opcional)
          </label>
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
          <label htmlFor="engine" className={labelClasses}>
            Motor (opcional)
          </label>
          <input id="engine" name="engine" type="text" defaultValue={car?.engine ?? ""} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="transmission" className={labelClasses}>
            Caja (opcional)
          </label>
          <input
            id="transmission"
            name="transmission"
            type="text"
            defaultValue={car?.transmission ?? ""}
            className={inputClasses}
          />
        </div>
        <div>
          <label htmlFor="color" className={labelClasses}>
            Color (opcional)
          </label>
          <input id="color" name="color" type="text" defaultValue={car?.color ?? ""} className={inputClasses} />
        </div>
      </div>

      <div>
        <label htmlFor="summary" className={labelClasses}>
          Resumen (se ve en la tarjeta de /autos)
        </label>
        <input id="summary" name="summary" type="text" required defaultValue={car?.summary ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.summary} />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Descripción completa (ficha del auto)
        </label>
        <textarea id="description" name="description" rows={6} defaultValue={car?.description ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Estado
          </label>
          <select id="status" name="status" defaultValue={car?.status ?? "draft"} className={inputClasses}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="hidden">Oculto</option>
            <option value="discontinued">Vendido</option>
          </select>
        </div>
        <div>
          <label htmlFor="published_from" className={labelClasses}>
            Vigente desde (opcional)
          </label>
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
          <label htmlFor="published_until" className={labelClasses}>
            Vigente hasta (opcional)
          </label>
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
          <label htmlFor="seo_title" className={labelClasses}>
            SEO: título (opcional)
          </label>
          <input id="seo_title" name="seo_title" type="text" defaultValue={car?.seo_title ?? ""} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="seo_description" className={labelClasses}>
            SEO: descripción (opcional)
          </label>
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
