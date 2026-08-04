"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import type { ProjectVideoActionState } from "@/actions/admin/projects";
import type { ProjectStage, ProjectVideo } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectVideoActionState = { status: "idle", message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/**
 * Video del proyecto: YouTube (solo link) o archivo propio (subida corta o
 * pegar una URL ya alojada — ver MAX_VIDEO_FILE_BYTES en lib/utils/video.ts,
 * pensado para clips cortos por el límite de body de Vercel).
 */
export function ProjectVideoForm({
  action,
  video,
  stages = [],
  submitLabel = "Agregar",
}: {
  action: (state: ProjectVideoActionState, formData: FormData) => Promise<ProjectVideoActionState>;
  video?: ProjectVideo;
  stages?: ProjectStage[];
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [kind, setKind] = useState<"youtube" | "file">(video?.kind ?? "youtube");
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    if (!video) formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <div>
        <FieldLabel className={labelClasses} help="Elegí si el video se embebe desde YouTube o se sube/aloja como archivo propio.">
          Tipo
        </FieldLabel>
        <select
          name="kind"
          value={kind}
          onChange={(e) => setKind(e.target.value as "youtube" | "file")}
          className={inputClasses}
        >
          <option value="youtube">Link de YouTube</option>
          <option value="file">Archivo propio / URL alojada</option>
        </select>
      </div>

      {kind === "youtube" ? (
        <div>
          <FieldLabel
            className={labelClasses}
            help="Link completo del video en YouTube."
            example="https://youtube.com/watch?v=dQw4w9WgXcQ"
          >
            URL de YouTube
          </FieldLabel>
          <input
            name="youtube_url"
            type="text"
            placeholder="https://youtube.com/watch?v=..."
            defaultValue={video?.youtube_url ?? ""}
            className={inputClasses}
          />
          {state.fieldErrors?.youtube_url?.length ? (
            <p className="mt-1 text-xs text-primary">{state.fieldErrors.youtube_url[0]}</p>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <div>
            <FieldLabel
              className={labelClasses}
              help="Subí un video corto directamente. Por el límite de tamaño del servidor, solo sirve para clips breves."
            >
              Subir archivo (clips cortos, máx. 4MB)
            </FieldLabel>
            <input
              name="file"
              type="file"
              accept="video/*"
              className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-sm file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-background hover:file:bg-primary/90"
            />
          </div>
          <div>
            <FieldLabel
              className={labelClasses}
              help="Alternativa a subir el archivo: pegá la URL de un video ya alojado en otro lugar."
              example="https://mi-storage.com/videos/prueba.mp4"
            >
              ...o pegar la URL de un video ya alojado
            </FieldLabel>
            <input
              name="video_url"
              type="text"
              placeholder="https://... o /videos/ejemplo.mp4"
              defaultValue={video?.video_url ?? ""}
              className={inputClasses}
            />
            {state.fieldErrors?.video_url?.length ? (
              <p className="mt-1 text-xs text-primary">{state.fieldErrors.video_url[0]}</p>
            ) : null}
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <FieldLabel
            className={labelClasses}
            help="Asocia el video a una etapa de la línea de tiempo del proyecto, si corresponde."
          >
            Hito de la línea de tiempo (opcional)
          </FieldLabel>
          <select name="stage_id" defaultValue={video?.stage_id ?? ""} className={inputClasses}>
            <option value="">Sin asociar</option>
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <FieldLabel className={labelClasses} help="Posición del video en la lista. Los números más bajos aparecen primero." example="0">
            Orden
          </FieldLabel>
          <input name="position" type="number" min={0} defaultValue={video?.position ?? 0} className={inputClasses} />
        </div>
      </div>

      <div>
        <FieldLabel
          className={labelClasses}
          help="Controla si este video se ve en la ficha pública del proyecto (si el proyecto en sí es público)."
        >
          Visibilidad
        </FieldLabel>
        <select name="visibility" defaultValue={video?.visibility ?? "public"} className={inputClasses}>
          <option value="public">Pública</option>
          <option value="private">Privada</option>
        </select>
        <p className="mt-1 text-xs text-foreground/40">
          Si el proyecto es privado, ningún video se ve públicamente aunque acá diga &quot;público&quot;.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
        {state.status !== "idle" && (
          <p className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
