"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProjectDocument } from "@/actions/admin/projects";
import type { ProjectDocument } from "@/types/database";

/** `signedUrl` se genera en el server (createSignedUrl, corta duración) porque el bucket 'project-private' no tiene lectura pública. */
export function ProjectDocumentRow({
  doc,
  projectId,
  signedUrl,
}: {
  doc: ProjectDocument;
  projectId: string;
  signedUrl: string | null;
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
      {signedUrl ? (
        <a href={signedUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-foreground/80 hover:text-primary">
          {doc.name}
        </a>
      ) : (
        <span className="text-sm text-foreground/50">{doc.name} (no disponible)</span>
      )}
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
