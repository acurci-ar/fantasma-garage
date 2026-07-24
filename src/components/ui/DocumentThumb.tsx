import { cn } from "@/lib/utils/cn";

function extensionOf(name: string): string {
  const idx = name.lastIndexOf(".");
  return idx === -1 ? "" : name.slice(idx + 1).toLowerCase();
}

type FileKind = "pdf" | "word" | "excel" | "file";

function kindOf(mimeType: string | null, name: string): FileKind {
  const ext = extensionOf(name);
  if (mimeType === "application/pdf" || ext === "pdf") return "pdf";
  if (ext === "doc" || ext === "docx" || Boolean(mimeType?.includes("word"))) return "word";
  if (ext === "xls" || ext === "xlsx" || Boolean(mimeType?.includes("sheet")) || Boolean(mimeType?.includes("excel"))) {
    return "excel";
  }
  return "file";
}

const KIND_STYLES: Record<FileKind, { label: string; className: string }> = {
  pdf: { label: "PDF", className: "border-red-400/40 text-red-400" },
  word: { label: "DOC", className: "border-blue-400/40 text-blue-400" },
  excel: { label: "XLS", className: "border-emerald-400/40 text-emerald-400" },
  file: { label: "", className: "border-secondary/40 text-foreground/50" },
};

/**
 * Preview de un documento: si hay `thumbnailUrl` (generada solo para
 * archivos-imagen, ver uploadPrivateDocument en lib/supabase/upload.ts)
 * muestra esa miniatura — la gran mayoría van a ser fotos de facturas. Si
 * no, muestra un ícono genérico según tipo de archivo (PDF/Word/Excel/otro)
 * inferido de mime_type o de la extensión del nombre.
 *
 * Usa <img> en vez de next/image a propósito: `thumbnailUrl` es una signed
 * URL de corta duración (bucket privado 'project-private') con query params
 * que cambian en cada request, no un asset estable para optimizar.
 */
export function DocumentThumb({
  name,
  mimeType,
  thumbnailUrl,
  size = "md",
}: {
  name: string;
  mimeType: string | null;
  thumbnailUrl?: string | null;
  size?: "sm" | "md";
}) {
  const dimension = size === "sm" ? "h-10 w-10" : "h-14 w-14";

  if (thumbnailUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={thumbnailUrl} alt="" className={cn(dimension, "shrink-0 rounded-sm object-cover")} />;
  }

  const ext = extensionOf(name);
  const kind = kindOf(mimeType, name);
  const style = KIND_STYLES[kind];

  return (
    <div
      className={cn(
        dimension,
        "flex shrink-0 flex-col items-center justify-center gap-0.5 rounded-sm border bg-card/60",
        style.className
      )}
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-4 w-4">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 2h9l5 5v15a1 1 0 01-1 1H6a1 1 0 01-1-1V3a1 1 0 011-1z" />
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 2v5h5" />
      </svg>
      <span className="text-[8px] font-semibold uppercase tracking-wide">{kind === "file" ? ext || "?" : style.label}</span>
    </div>
  );
}
