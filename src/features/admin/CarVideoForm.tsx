"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { FieldLabel } from "@/components/ui/FieldLabel";
import type { CarVideoActionState } from "@/actions/admin/cars";
import type { CarVideo } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: CarVideoActionState = { status: "idle", message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/** Video del auto: YouTube (solo link) o archivo propio — mismo patrón que ProjectVideoForm, sin hito de línea de tiempo ni visibilidad (no aplican acá). El orden se arrastra en la lista (ver CarVideoManager). */
export function CarVideoForm({
  action,
  video,
  submitLabel = "Agregar",
}: {
  action: (state: CarVideoActionState, formData: FormData) => Promise<CarVideoActionState>;
  video?: CarVideo;
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

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton label={submitLabel} />
        {state.status !== "idle" && (
          <p className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
