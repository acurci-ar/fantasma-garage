"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { resizeImageForUpload } from "@/lib/utils/clientImageResize";
import { MAX_BULK_BATCH_BYTES } from "@/lib/utils/image";
import type { BulkUploadActionState } from "@/lib/validation/admin/bulkUpload";

type UploadPhase = "idle" | "resizing" | "uploading" | "done";

interface Progress {
  batchesDone: number;
  batchesTotal: number;
  uploaded: number;
  failed: number;
  totalFiles: number;
}

/** Junta archivos en lotes cuyo peso acumulado no supere maxBytes (excepto un
 * archivo solo que ya de por sí pese más: ese va solo en su propio lote). */
function packIntoBatches(files: File[], maxBytes: number): File[][] {
  const batches: File[][] = [];
  let current: File[] = [];
  let currentBytes = 0;

  for (const file of files) {
    if (current.length > 0 && currentBytes + file.size > maxBytes) {
      batches.push(current);
      current = [];
      currentBytes = 0;
    }
    current.push(file);
    currentBytes += file.size;
  }
  if (current.length > 0) batches.push(current);

  return batches;
}

/**
 * Carga masiva: seleccionar varios archivos y subirlos todos juntos, sin
 * pedir epígrafe/texto alternativo/etc. en el momento — esos datos se
 * completan foto por foto con GalleryImageRow/ProjectImageRow una vez
 * subidas.
 *
 * No usa useFormState/<form action>: con muchos archivos (o archivos
 * grandes) un solo envío puede superar el límite de ~4.5MB que Vercel le
 * pone al body de una Server Action, y esa respuesta 413 llega en un
 * formato que useFormState no sabe interpretar (rompía la página con
 * "Cannot read properties of undefined"). Acá se controla todo a mano: cada
 * imagen se achica en el navegador antes de subir (resizeImageForUpload),
 * los archivos se empaquetan en lotes que no superen MAX_BULK_BATCH_BYTES, y
 * cada lote se manda con su propio try/catch — un lote que falla no rompe
 * la página ni cancela los lotes siguientes.
 */
export function BulkImageUploadForm({
  action,
}: {
  action: (state: BulkUploadActionState, formData: FormData) => Promise<BulkUploadActionState>;
}) {
  const [phase, setPhase] = useState<UploadPhase>("idle");
  const [progress, setProgress] = useState<Progress | null>(null);
  const [fileCount, setFileCount] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const busy = phase === "resizing" || phase === "uploading";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const files = Array.from(inputRef.current?.files ?? []);
    if (files.length === 0) return;

    setErrorMessage(null);
    setPhase("resizing");
    setProgress({ batchesDone: 0, batchesTotal: 0, uploaded: 0, failed: 0, totalFiles: files.length });

    const resized: File[] = [];
    for (const file of files) {
      resized.push(await resizeImageForUpload(file));
    }

    const batches = packIntoBatches(resized, MAX_BULK_BATCH_BYTES);
    setPhase("uploading");
    setProgress({ batchesDone: 0, batchesTotal: batches.length, uploaded: 0, failed: 0, totalFiles: files.length });

    let totalUploaded = 0;
    let totalFailed = 0;

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      if (!batch) continue;
      const formData = new FormData();
      for (const file of batch) formData.append("files", file);

      try {
        const result = await action({ status: "idle", message: "" }, formData);
        totalUploaded += result.uploaded ?? (result.status === "success" ? batch.length : 0);
        totalFailed += result.failed ?? (result.status === "error" ? batch.length : 0);
      } catch {
        // Falla de red/transporte (por ej. un 413 si algún lote igual quedó
        // grande): no rompemos la página, contamos ese lote como fallido y
        // seguimos con el resto.
        totalFailed += batch.length;
      }

      setProgress({
        batchesDone: i + 1,
        batchesTotal: batches.length,
        uploaded: totalUploaded,
        failed: totalFailed,
        totalFiles: files.length,
      });
    }

    setPhase("done");
    if (totalFailed > 0 && totalUploaded === 0) {
      setErrorMessage("No pudimos subir ninguna de las imágenes seleccionadas. Probá de nuevo.");
    }
    if (inputRef.current) inputRef.current.value = "";
    setFileCount(0);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <div>
        <label className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
          Subir varias fotos a la vez
        </label>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*"
          disabled={busy}
          onChange={(e) => setFileCount(e.target.files?.length ?? 0)}
          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-sm file:border-0 file:bg-secondary/20 file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:text-foreground file:transition-colors file:duration-220 hover:file:bg-secondary/30 disabled:cursor-not-allowed disabled:opacity-50"
        />
        <p className="mt-2 text-xs text-foreground/40">
          Se agregan sin epígrafe ni texto alternativo: completá esos datos foto por foto en la lista de arriba
          una vez subidas. Podés seleccionar tantas como quieras — se achican en el navegador y se suben en
          varios lotes automáticamente.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <Button type="submit" loading={busy} disabled={fileCount === 0}>
          {fileCount > 0 ? `Subir ${fileCount} foto${fileCount === 1 ? "" : "s"}` : "Subir fotos"}
        </Button>

        {phase === "resizing" && (
          <p role="status" aria-live="polite" className="text-sm text-foreground/60">
            Preparando {progress?.totalFiles} foto{progress?.totalFiles === 1 ? "" : "s"}...
          </p>
        )}

        {phase === "uploading" && progress && (
          <p role="status" aria-live="polite" className="text-sm text-foreground/60">
            Subiendo lote {progress.batchesDone + 1} de {progress.batchesTotal} ({progress.uploaded} de{" "}
            {progress.totalFiles} fotos subidas)...
          </p>
        )}

        {phase === "done" && progress && (
          <p
            role="status"
            aria-live="polite"
            className={progress.failed === 0 ? "text-sm text-primary" : "text-sm text-red-400"}
          >
            {progress.failed > 0
              ? `Se subieron ${progress.uploaded} de ${progress.totalFiles} fotos (${progress.failed} fallaron).`
              : `Se subieron ${progress.uploaded} foto${progress.uploaded === 1 ? "" : "s"}.`}
          </p>
        )}

        {errorMessage && <p className="text-sm text-red-400">{errorMessage}</p>}
      </div>
    </form>
  );
}
