"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { ProjectImageActionState } from "@/actions/admin/projects";
import type { ProjectImage, ProjectStage } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectImageActionState = { status: "idle", message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/**
 * Form de imagen del proyecto, reutilizado para "agregar" (sin `image`,
 * se resetea solo tras un alta exitosa gracias a la `key` que le pone el
 * padre) y para editar una existente (con `image`, ver ProjectImageRow).
 */
export function ProjectImageForm({
  action,
  image,
  stages = [],
  submitLabel = "Agregar",
}: {
  action: (state: ProjectImageActionState, formData: FormData) => Promise<ProjectImageActionState>;
  image?: ProjectImage;
  stages?: ProjectStage[];
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    // Modo "agregar" (sin `image`): limpiar el formulario para cargar la
    // siguiente foto. En modo edición se deja tal cual, solo se refresca la
    // lista del padre (por si cambió el orden, por ejemplo).
    if (!image) formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <ImageUploadField
        fileFieldName="file"
        urlFieldName="url"
        initialUrl={image?.url}
        urlFieldErrors={state.fieldErrors?.url}
      />

      <div>
        <label className={labelClasses}>Texto alternativo</label>
        <input name="alt" type="text" defaultValue={image?.alt ?? ""} className={inputClasses} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>Hito de la línea de tiempo (opcional)</label>
          <select name="stage_id" defaultValue={image?.stage_id ?? ""} className={inputClasses}>
            <option value="">Sin asociar</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClasses}>Orden</label>
          <input name="position" type="number" min={0} defaultValue={image?.position ?? 0} className={inputClasses} />
        </div>
      </div>

      <input type="hidden" name="stage" defaultValue={image?.stage ?? ""} />

      <div>
        <label className={labelClasses}>Visibilidad</label>
        <select name="visibility" defaultValue={image?.visibility ?? "public"} className={inputClasses}>
          <option value="public">Pública</option>
          <option value="private">Privada</option>
        </select>
        <p className="mt-1 text-xs text-foreground/40">
          Si el proyecto es privado, ninguna foto se ve públicamente aunque acá diga &quot;pública&quot;.
        </p>
      </div>

      <div className="flex flex-wrap gap-4">
        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            name="is_before"
            defaultChecked={image?.is_before ?? false}
            className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
          />
          Foto &quot;antes&quot;
        </label>
        <label className="flex items-center gap-2 text-sm text-foreground/70">
          <input
            type="checkbox"
            name="is_after"
            defaultChecked={image?.is_after ?? false}
            className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
          />
          Foto &quot;después&quot;
        </label>
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
