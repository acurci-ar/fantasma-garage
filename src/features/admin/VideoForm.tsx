"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { VideoActionState } from "@/actions/admin/videos";
import type { Video } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: VideoActionState = { status: "idle", message: "" };

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

export function VideoForm({
  action,
  video,
  submitLabel = "Guardar",
}: {
  action: (state: VideoActionState, formData: FormData) => Promise<VideoActionState>;
  video?: Video;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);

  return (
    <form action={formAction} className="max-w-lg space-y-5">
      <div>
        <label htmlFor="title" className={labelClasses}>
          Título
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={video?.title ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.title} />
      </div>

      <div>
        <label htmlFor="youtube_url" className={labelClasses}>
          URL de YouTube
        </label>
        <input
          id="youtube_url"
          name="youtube_url"
          type="url"
          required
          placeholder="https://www.youtube.com/watch?v=..."
          defaultValue={video?.youtube_url ?? ""}
          className={inputClasses}
        />
        <FieldError errors={state.fieldErrors?.youtube_url} />
      </div>

      <div>
        <label htmlFor="position" className={labelClasses}>
          Orden
        </label>
        <input
          id="position"
          name="position"
          type="number"
          min={0}
          defaultValue={video?.position ?? 0}
          className={inputClasses}
        />
        <p className="mt-1 text-xs text-foreground/40">
          Entre los destacados, los números más bajos aparecen primero en la home.
        </p>
        <FieldError errors={state.fieldErrors?.position} />
      </div>

      <label className="flex items-center gap-2 text-sm text-foreground/70">
        <input
          type="checkbox"
          name="featured"
          defaultChecked={video?.featured ?? false}
          className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
        />
        Destacado en la home (máximo 3 a la vez)
      </label>

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
