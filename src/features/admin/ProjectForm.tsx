"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import { slugify } from "@/lib/utils/format";
import type { Project } from "@/types/database";
import type { ProjectActionState } from "@/actions/admin/projects";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectActionState = { status: "idle", message: "" };

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

export function ProjectForm({
  action,
  project,
  submitLabel,
}: {
  action: (prevState: ProjectActionState, formData: FormData) => Promise<ProjectActionState>;
  project?: Project;
  submitLabel: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [slugTouched, setSlugTouched] = useState(Boolean(project));
  const [title, setTitle] = useState(project?.title ?? "");
  const [slug, setSlug] = useState(project?.slug ?? "");

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
            help="Nombre interno para identificar este proyecto en el admin (no es necesariamente lo que ve el cliente)."
            example="Restauración Ford Falcon 1978"
          >
            Título interno
          </FieldLabel>
          <input
            id="title"
            name="title"
            type="text"
            required
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
            example="restauracion-ford-falcon-1978"
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
          <FieldLabel htmlFor="make" className={labelClasses} help="Fabricante del vehículo." example="Ford">
            Marca
          </FieldLabel>
          <input id="make" name="make" type="text" required defaultValue={project?.make ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.make} />
        </div>
        <div>
          <FieldLabel htmlFor="model" className={labelClasses} help="Modelo del vehículo." example="Falcon">
            Modelo
          </FieldLabel>
          <input id="model" name="model" type="text" required defaultValue={project?.model ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.model} />
        </div>
        <div>
          <FieldLabel htmlFor="year" className={labelClasses} help="Año de fabricación del vehículo." example="1978">
            Año
          </FieldLabel>
          <input
            id="year"
            name="year"
            type="number"
            min={1900}
            max={2100}
            required
            defaultValue={project?.year ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.year} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel
            htmlFor="vin"
            className={labelClasses}
            help="Número de identificación del vehículo (chasis), si se conoce."
            example="1FAPP6242WH123456"
          >
            VIN (opcional)
          </FieldLabel>
          <input id="vin" name="vin" type="text" defaultValue={project?.vin ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.vin} />
        </div>
        <div>
          <FieldLabel htmlFor="engine" className={labelClasses} help="Motorización del vehículo." example="6 cilindros 3.6L">
            Motor (opcional)
          </FieldLabel>
          <input id="engine" name="engine" type="text" defaultValue={project?.engine ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.engine} />
        </div>
        <div>
          <FieldLabel htmlFor="transmission" className={labelClasses} help="Tipo de caja de cambios." example="Manual 3 velocidades">
            Caja (opcional)
          </FieldLabel>
          <input
            id="transmission"
            name="transmission"
            type="text"
            defaultValue={project?.transmission ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.transmission} />
        </div>
      </div>

      <div>
        <FieldLabel
          htmlFor="client_name"
          className={labelClasses}
          help="Nombre del cliente dueño del vehículo. Uso interno únicamente, nunca se muestra en la ficha pública."
          example="Juan Pérez"
        >
          Cliente (opcional — siempre privado, nunca se muestra en la ficha pública)
        </FieldLabel>
        <input
          id="client_name"
          name="client_name"
          type="text"
          defaultValue={project?.client_name ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.client_name} />
      </div>

      <div>
        <FieldLabel
          htmlFor="summary"
          className={labelClasses}
          help="Frase corta que se ve en la tarjeta del proyecto, en /proyectos y en la home."
          example="Restauración integral de chapa, motor y tapizados."
        >
          Resumen (se ve en la tarjeta de /proyectos)
        </FieldLabel>
        <input id="summary" name="summary" type="text" required defaultValue={project?.summary ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.summary} />
      </div>

      <div>
        <FieldLabel
          htmlFor="story"
          className={labelClasses}
          help="Texto completo de la ficha pública del proyecto, con toda la historia y el proceso de trabajo."
          example="El auto llegó con el motor fundido y la chapa muy dañada. Se hizo una restauración completa en 8 meses..."
        >
          Historia completa (ficha del proyecto)
        </FieldLabel>
        <textarea id="story" name="story" rows={6} defaultValue={project?.story ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.story} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <FieldLabel htmlFor="status" className={labelClasses} help="En qué etapa está el proyecto de restauración.">
            Etapa
          </FieldLabel>
          <select id="status" name="status" defaultValue={project?.status ?? "en_curso"} className={inputClasses}>
            <option value="en_curso">En curso</option>
            <option value="finalizado">Finalizado</option>
            <option value="en_pausa">En pausa</option>
          </select>
        </div>
        <div>
          <FieldLabel
            htmlFor="visibility"
            className={labelClasses}
            help="Controla quién puede ver la ficha del proyecto en el sitio público."
          >
            Visibilidad
          </FieldLabel>
          <select id="visibility" name="visibility" defaultValue={project?.visibility ?? "public"} className={inputClasses}>
            <option value="public">Público</option>
            <option value="private">Privado</option>
          </select>
          <p className="mt-1 text-xs text-foreground/40">
            Si es privado, solo lo ven admin/staff y los emails con acceso otorgado (ver más abajo).
          </p>
        </div>
        <label className="flex items-center gap-2 self-end pb-3 text-sm text-foreground/70">
          <input
            type="checkbox"
            name="featured"
            defaultChecked={project?.featured ?? false}
            className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
          />
          Destacado en la home
        </label>
      </div>
      <p className="-mt-3 text-xs text-foreground/40">
        Esto solo controla si aparece entre los 3 destacados de la home. En /proyectos aparecen siempre todos los
        proyectos públicos, más los privados a los que cada usuario tenga acceso otorgado.
      </p>

      <div className="space-y-5 rounded-sm border border-secondary/30 p-5">
        <p className={labelClasses}>Foto de portada</p>
        <ImageUploadField
          fileFieldName="cover_file"
          urlFieldName="cover_url"
          initialUrl={project?.cover_url}
          urlFieldErrors={state.fieldErrors?.cover_url}
        />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <FieldLabel
            htmlFor="seo_title"
            className={labelClasses}
            help="Título que usan los buscadores (Google) y al compartir el link. Si lo dejás vacío, se usa marca + modelo + año."
            example="Restauración Ford Falcon 1978 — Fantasma Garage"
          >
            SEO: título (opcional)
          </FieldLabel>
          <input id="seo_title" name="seo_title" type="text" defaultValue={project?.seo_title ?? ""} className={inputClasses} />
        </div>
        <div>
          <FieldLabel
            htmlFor="seo_description"
            className={labelClasses}
            help="Texto que aparece debajo del título en los resultados de Google y al compartir el link."
            example="Restauración completa de un Ford Falcon 1978, motor y chapa a nuevo."
          >
            SEO: descripción (opcional)
          </FieldLabel>
          <input
            id="seo_description"
            name="seo_description"
            type="text"
            defaultValue={project?.seo_description ?? ""}
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
