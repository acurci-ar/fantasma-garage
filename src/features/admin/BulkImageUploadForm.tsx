"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";

interface BulkUploadActionState {
  status: "idle" | "success" | "error";
  message: string;
}

function SubmitButton({ count }: { count: number }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending} disabled={count === 0}>
      {count > 0 ? `Subir ${count} foto${count === 1 ? "" : "s"}` : "Subir fotos"}
    </Button>
  );
}

/**
 * Carga masiva: seleccionar varios archivos y subirlos todos juntos, sin
 * pedir epígrafe/texto alternativo/etc. en el momento — esos datos se
 * completan foto por foto con GalleryImageRow/ProjectImageRow una vez
 * subidas (mismo patrón "agregar sin metadata, editar después" en las dos
 * secciones que usan este componente).
 *
 * Genérico en el estado (S) para aceptar tanto GalleryImageActionState como
 * ProjectImageActionState (ambos tienen status/message + su propio
 * fieldErrors opcional) sin forzar un tipo de estado propio distinto al de
 * las Server Actions que ya existían.
 */
export function BulkImageUploadForm<S extends BulkUploadActionState>({
  action,
  initialState,
}: {
  action: (state: S, formData: FormData) => Promise<S>;
  initialState: S;
}) {
  const [state, formAction] = useFormState(action, initialState);
  const [fileCount, setFileCount] = useState(0);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    setFileCount(0);
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Subir varias fotos a la vez
        </label>
        <input
          type="file"
          name="files"
          multiple
          accept="image/*"
          onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-sm file:border-0 file:bg-secondary/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:text-foreground file:transition-colors file:duration-220 hover:file:bg-secondary/30"
        />
        <p className="mt-2 text-xs text-foreground/40">
          Se agregan sin epígrafe ni texto alternativo: completá esos datos foto por foto en la lista de arriba
          una vez subidas.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton count={fileCount} />
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
