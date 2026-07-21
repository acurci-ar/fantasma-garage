"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { Gallery } from "@/types/database";
import type { GalleryActionState } from "@/actions/admin/galleries";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: GalleryActionState = { status: "idle", message: "" };

function FieldError({ errors }: { errors?: string[] }) {
  if (!errors?.length) return null;
  return <p className="mt-1 text-xs text-primary">{errors[0]}</p>;
}

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} size="lg">
      Guardar cambios
    </Button>
  );
}

export function GalleryForm({
  action,
  gallery,
}: {
  action: (state: GalleryActionState, formData: FormData) => Promise<GalleryActionState>;
  gallery: Gallery;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="max-w-2xl space-y-6">
      <div>
        <label htmlFor="title" className={labelClasses}>
          Título
        </label>
        <input id="title" name="title" type="text" required defaultValue={gallery.title} className={inputClasses} />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div>
        <label htmlFor="description" className={labelClasses}>
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          defaultValue={gallery.description ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.description} />
      </div>

      <div>
        <label htmlFor="status" className={labelClasses}>
          Estado
        </label>
        <select id="status" name="status" defaultValue={gallery.status} className={inputClasses}>
          <option value="draft">Borrador</option>
          <option value="published">Publicado</option>
          <option value="hidden">Oculto</option>
          <option value="discontinued">Discontinuado</option>
        </select>
        <p className="mt-1 text-xs text-foreground/40">Solo &quot;Publicado&quot; se muestra en /galerias y la home.</p>
      </div>

      <div className="space-y-5 rounded-sm border border-secondary/30 p-5">
        <p className={labelClasses}>Foto de portada</p>
        <ImageUploadField
          fileFieldName="cover_file"
          urlFieldName="cover_url"
          initialUrl={gallery.cover_url}
          urlFieldErrors={state.fieldErrors?.cover_url}
        />
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
