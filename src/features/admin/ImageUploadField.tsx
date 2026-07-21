"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { formatBytes, isImageTooHeavy, exceedsHardLimit, MAX_PRODUCT_IMAGE_BYTES } from "@/lib/utils/image";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

/**
 * Subir archivo o pegar URL, con preview y aviso de "imagen pesada" —
 * extraído de ProductForm para reutilizar en el ABMC de proyectos y
 * galerías (portada de proyecto/galería e imágenes individuales) sin
 * duplicar la lógica de validación/preview cuatro veces.
 */
export function ImageUploadField({
  fileFieldName,
  urlFieldName,
  initialUrl,
  urlLabel = "...o pegar una ruta/URL en su lugar",
  urlFieldErrors,
}: {
  fileFieldName: string;
  urlFieldName: string;
  initialUrl?: string;
  urlLabel?: string;
  urlFieldErrors?: string[];
}) {
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [fileWarning, setFileWarning] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setFileWarning(null);
    setFileError(null);

    if (filePreview) {
      URL.revokeObjectURL(filePreview);
      setFilePreview(null);
    }

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setFileError("El archivo tiene que ser una imagen.");
      e.target.value = "";
      return;
    }

    if (exceedsHardLimit(file.size)) {
      setFileError(
        `Pesa ${formatBytes(file.size)}. El máximo permitido es ${formatBytes(MAX_PRODUCT_IMAGE_BYTES)}: elegí una imagen más liviana.`
      );
      e.target.value = "";
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    setFilePreview(objectUrl);
    // Si se elige un archivo, tiene prioridad sobre la URL pegada a mano.
    if (urlInputRef.current) urlInputRef.current.value = "";

    const probe = document.createElement("img");
    probe.onload = () => {
      if (isImageTooHeavy(file.size, probe.naturalWidth, probe.naturalHeight)) {
        setFileWarning(
          `Pesa ${formatBytes(file.size)} (${probe.naturalWidth}×${probe.naturalHeight}px). Para que la web cargue rápido conviene achicarla a menos de ${formatBytes(400 * 1024)} y no más de 2000px de lado. Se puede subir igual.`
        );
      }
    };
    probe.src = objectUrl;
  }

  return (
    <div className="space-y-4">
      <span className="relative -top-px inline-flex h-32 w-32 items-center justify-center overflow-hidden rounded-sm bg-card">
        {(() => {
          const previewSrc = filePreview ?? initialUrl;
          if (!previewSrc) {
            return <span className="text-[11px] text-foreground/30">Sin imagen</span>;
          }
          return (
            <Image
              src={previewSrc}
              alt=""
              fill
              sizes="128px"
              className="object-cover"
              unoptimized={Boolean(filePreview)}
            />
          );
        })()}
      </span>

      <div>
        <label htmlFor={fileFieldName} className={labelClasses}>
          Subir un archivo
        </label>
        <input
          id={fileFieldName}
          name={fileFieldName}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-sm file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-background hover:file:bg-primary/90"
        />
        {fileError && <p className="mt-2 text-xs text-red-400">{fileError}</p>}
        {fileWarning && !fileError && <p className="mt-2 text-xs text-primary">{fileWarning}</p>}
        <p className="mt-2 text-xs text-foreground/40">Máximo {formatBytes(MAX_PRODUCT_IMAGE_BYTES)}.</p>
      </div>

      <div>
        <label htmlFor={urlFieldName} className={labelClasses}>
          {urlLabel}
        </label>
        <input
          ref={urlInputRef}
          id={urlFieldName}
          name={urlFieldName}
          type="text"
          placeholder="/images/ejemplo.webp"
          defaultValue={initialUrl ?? ""}
          onFocus={() => {
            if (filePreview) {
              URL.revokeObjectURL(filePreview);
              setFilePreview(null);
              setFileWarning(null);
              const fileInput = document.getElementById(fileFieldName) as HTMLInputElement | null;
              if (fileInput) fileInput.value = "";
            }
          }}
          className={inputClasses}
        />
        {urlFieldErrors?.length ? <p className="mt-1 text-xs text-primary">{urlFieldErrors[0]}</p> : null}
        <p className="mt-2 text-xs text-foreground/40">Si subís un archivo, tiene prioridad sobre esta URL.</p>
      </div>
    </div>
  );
}
