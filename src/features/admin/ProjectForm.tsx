"use client";

import { useEffect, useState } from "react";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
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
          <label htmlFor="title" className={labelClasses}>
            Título interno
          </label>
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
          <input id="make" name="make" type="text" required defaultValue={project?.make ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.make} />
        </div>
        <div>
          <label htmlFor="model" className={labelClasses}>
            Modelo
          </label>
          <input id="model" name="model" type="text" required defaultValue={project?.model ?? ""} className={inputClasses} />
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
            defaultValue={project?.year ?? ""}
            className={inputClasses}
          />
          <FieldError errors={state.fieldErrors?.year} />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="vin" className={labelClasses}>
            VIN (opcional)
          </label>
          <input id="vin" name="vin" type="text" defaultValue={project?.vin ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.vin} />
        </div>
        <div>
          <label htmlFor="engine" className={labelClasses}>
            Motor (opcional)
          </label>
          <input id="engine" name="engine" type="text" defaultValue={project?.engine ?? ""} className={inputClasses} />
          <FieldError errors={state.fieldErrors?.engine} />
        </div>
        <div>
          <label htmlFor="transmission" className={labelClasses}>
            Caja (opcional)
          </label>
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
        <label htmlFor="client_name" className={labelClasses}>
          Cliente (opcional — siempre privado, nunca se muestra en la ficha pública)
        </label>
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
        <label htmlFor="summary" className={labelClasses}>
          Resumen (se ve en la tarjeta de /proyectos)
        </label>
        <input id="summary" name="summary" type="text" required defaultValue={project?.summary ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.summary} />
      </div>

      <div>
        <label htmlFor="story" className={labelClasses}>
          Historia completa (ficha del proyecto)
        </label>
        <textarea id="story" name="story" rows={6} defaultValue={project?.story ?? ""} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.story} />
      </div>

      <div className="grid gap-5 sm:grid-cols-3">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Etapa
          </label>
          <select id="status" name="status" defaultValue={project?.status ?? "en_curso"} className={inputClasses}>
            <option value="en_curso">En curso</option>
            <option value="finalizado">Finalizado</option>
            <option value="en_pausa">En pausa</option>
          </select>
        </div>
        <div>
          <label htmlFor="visibility" className={labelClasses}>
            Visibilidad
          </label>
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
          Publicado en /proyectos y la home
        </label>
      </div>

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
          <label htmlFor="seo_title" className={labelClasses}>
            SEO: título (opcional)
          </label>
          <input id="seo_title" name="seo_title" type="text" defaultValue={project?.seo_title ?? ""} className={inputClasses} />
        </div>
        <div>
          <label htmlFor="seo_description" className={labelClasses}>
            SEO: descripción (opcional)
          </label>
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
