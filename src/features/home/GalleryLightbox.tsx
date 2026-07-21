"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import type { GalleryImage } from "@/types/database";

interface GalleryLightboxProps {
  /** Primera página de fotos (ver GALLERY_PAGE_SIZE en lib/content/queries.ts). */
  images: GalleryImage[];
  /** Total de fotos publicadas en la galería, para saber si queda algo por cargar. */
  totalCount: number;
  /** id de la galería, para pedir la siguiente tanda. */
  galleryId: string;
  /** Server action que trae la siguiente tanda (ver actions/gallery.ts). */
  loadMoreAction: (galleryId: string, offset: number) => Promise<GalleryImage[]>;
}

/** Grid masonry-like + lightbox accesible con navegación por teclado, con
 * carga incremental ("Cargar más") para galerías de cientos de fotos. */
export function GalleryLightbox({ images: initialImages, totalCount, galleryId, loadMoreAction }: GalleryLightboxProps) {
  const [images, setImages] = useState(initialImages);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  const hasMore = images.length < totalCount;

  const loadMore = useCallback(() => {
    startTransition(async () => {
      const nextImages = await loadMoreAction(galleryId, images.length);
      setImages((prev) => [...prev, ...nextImages]);
    });
  }, [galleryId, images.length, loadMoreAction]);

  const close = useCallback(() => setActiveIndex(null), []);
  const next = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i + 1) % images.length)),
    [images.length]
  );
  const prev = useCallback(
    () => setActiveIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length)),
    [images.length]
  );

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") next();
      if (e.key === "ArrowLeft") prev();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, close, next, prev]);

  if (images.length === 0) {
    return <p className="text-sm text-foreground/50">Todavía no hay imágenes publicadas en esta galería.</p>;
  }

  const activeImage = activeIndex !== null ? images[activeIndex] : undefined;

  return (
    <>
      <div className="columns-1 gap-4 sm:columns-2 lg:columns-3 [&>*]:mb-4">
        {images.map((image, index) => (
          <button
            key={image.id}
            type="button"
            onClick={() => setActiveIndex(index)}
            className="block w-full overflow-hidden rounded-sm bg-card focus-visible:ring-2 focus-visible:ring-primary"
          >
            <Image
              src={image.thumb_url ?? image.url}
              alt={image.alt}
              width={800}
              height={600}
              sizes="(min-width: 1024px) 33vw, 50vw"
              className="h-auto w-full object-cover transition duration-320 hover:opacity-90 motion-reduce:transition-none"
            />
          </button>
        ))}
      </div>

      {hasMore && (
        <div className="mt-8 flex flex-col items-center gap-2">
          <Button type="button" variant="secondary" onClick={loadMore} disabled={isPending} aria-busy={isPending}>
            {isPending ? "Cargando..." : "Cargar más"}
          </Button>
          <p className="text-xs text-foreground/40">
            {images.length} de {totalCount} fotos
          </p>
        </div>
      )}

      {activeImage && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Visor de imagen"
          className="fixed inset-0 z-[70] flex items-center justify-center bg-background/95 p-4 backdrop-blur-sm"
          onClick={close}
        >
          <button
            type="button"
            onClick={close}
            aria-label="Cerrar"
            className="absolute right-5 top-5 flex h-11 w-11 items-center justify-center rounded-sm border border-secondary/50 text-foreground"
          >
            ✕
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              prev();
            }}
            aria-label="Imagen anterior"
            className="absolute left-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-sm border border-secondary/50 text-foreground sm:left-6"
          >
            ‹
          </button>
          <div className="relative max-h-[85vh] max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={activeImage.url}
              alt={activeImage.alt}
              width={1600}
              height={1200}
              className="max-h-[85vh] w-auto rounded-sm object-contain"
            />
            {activeImage.caption && (
              <p className="mt-3 text-center text-sm text-foreground/70">{activeImage.caption}</p>
            )}
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              next();
            }}
            aria-label="Imagen siguiente"
            className="absolute right-3 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-sm border border-secondary/50 text-foreground sm:right-6"
          >
            ›
          </button>
        </div>
      )}
    </>
  );
}
