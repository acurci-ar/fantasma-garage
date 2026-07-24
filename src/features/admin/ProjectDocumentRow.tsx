"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { DocumentThumb } from "@/components/ui/DocumentThumb";
import { deleteProjectDocument } from "@/actions/admin/projects";
import type { ProjectDocument } from "@/types/database";

/**
 * `signedUrl`/`thumbnailSignedUrl` se generan en el server (createSignedUrl,
 * corta duración) porque el bucket 'project-private' no tiene lectura
 * pública. `linkedExpenseDescription` viene seteado cuando el documento se
 * subió como factura de un gasto/extra puntual (ver expense_id).
 */
export function ProjectDocumentRow({
  doc,
  projectId,
  signedUrl,
  thumbnailSignedUrl,
  linkedExpenseDescription,
}: {
  doc: ProjectDocument;
  projectId: string;
  signedUrl: string | null;
  thumbnailSignedUrl?: string | null;
  linkedExpenseDescription?: string | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm(`¿Eliminar "${doc.name}"?`)) return;
    startTransition(async () => {
      const result = await deleteProjectDocument(doc.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-sm border border-secondary/30 bg-card/40 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <DocumentThumb name={doc.name} mimeType={doc.mime_type} thumbnailUrl={thumbnailSignedUrl} />
        <div className="min-w-0">
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="block truncate text-sm text-foreground/80 hover:text-primary"
            >
              {doc.name}
            </a>
          ) : (
            <span className="block truncate text-sm text-foreground/50">{doc.name} (no disponible)</span>
          )}
          {linkedExpenseDescription && (
            <span className="mt-1 inline-block rounded-sm bg-secondary/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/60">
              Gasto: {linkedExpenseDescription}
            </span>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="shrink-0 text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : "Eliminar"}
      </button>
    </div>
  );
}
