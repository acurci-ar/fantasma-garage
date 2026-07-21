"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ImageUploadField } from "@/features/admin/ImageUploadField";
import type { GalleryImageActionState } from "@/actions/admin/galleries";
import type { GalleryImage } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: GalleryImageActionState = { status: "idle", message: "" };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      {label}
    </Button>
  );
}

/**
 * Form de foto de galería, reutilizado para "agregar" (sin `image`) y para
 * editar una existente (con `image`, ver GalleryImageRow) — mismo patrón
 * que ProjectImageForm.
 */
export function GalleryImageForm({
  action,
  image,
  submitLabel = "Agregar",
}: {
  action: (state: GalleryImageActionState, formData: FormData) => Promise<GalleryImageActionState>;
  image?: GalleryImage;
  submitLabel?: string;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
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
          <label className={labelClasses}>Epígrafe (opcional)</label>
          <input name="caption" type="text" defaultValue={image?.caption ?? ""} className={inputClasses} />
        </div>
        <div>
          <label className={labelClasses}>Orden</label>
          <input name="position" type="number" min={0} defaultValue={image?.position ?? 0} className={inputClasses} />
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
