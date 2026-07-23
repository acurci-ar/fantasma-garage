import { formatDate } from "@/lib/utils/format";
import type { ProjectDocument } from "@/types/database";

/**
 * Documentación en modo solo lectura, para el usuario con acceso otorgado.
 * `signedUrl` se genera en el server (bucket privado 'project-private', ver
 * getSignedFileUrl) porque no hay lectura pública de esos archivos.
 */
export function ProjectDocumentsReadOnly({
  items,
}: {
  items: { doc: ProjectDocument; signedUrl: string | null }[];
}) {
  if (items.length === 0) {
    return <p className="max-w-2xl text-sm text-foreground/50">Todavía no hay documentos cargados para este proyecto.</p>;
  }

  return (
    <div className="max-w-2xl space-y-3">
      {items.map(({ doc, signedUrl }) => (
        <div
          key={doc.id}
          className="flex flex-wrap items-center justify-between gap-3 rounded-sm border border-secondary/30 bg-card/40 px-4 py-3"
        >
          {signedUrl ? (
            <a
              href={signedUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-foreground/80 hover:text-primary"
            >
              {doc.name}
            </a>
          ) : (
            <span className="text-sm text-foreground/50">{doc.name} (no disponible)</span>
          )}
          <span className="text-xs text-foreground/40">{formatDate(doc.created_at)}</span>
        </div>
      ))}
    </div>
  );
}
