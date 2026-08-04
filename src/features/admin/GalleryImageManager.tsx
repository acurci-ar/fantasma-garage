"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { GalleryImageRow } from "@/features/admin/GalleryImageRow";
import { reorderGalleryImages } from "@/actions/admin/galleries";
import type { GalleryImage } from "@/types/database";
import { useDragReorder } from "@/lib/utils/useDragReorder";
import { cn } from "@/lib/utils/cn";

function sortByPosition(images: GalleryImage[]): GalleryImage[] {
  return [...images].sort((a, b) => a.position - b.position);
}

/** Lista de fotos de la galería, arrastrable (ícono de agarre) para reordenar — mismo patrón que ProductImageManager/CarImageManager. */
export function GalleryImageManager({
  images,
  galleryId,
  gallerySlug,
}: {
  images: GalleryImage[];
  galleryId: string;
  gallerySlug: string;
}) {
  const [ordered, setOrdered] = useState(() => sortByPosition(images));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isDirty) return;
    setOrdered(sortByPosition(images));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images]);

  const { draggingIndex, overIndex, dragHandleProps, dropTargetProps } = useDragReorder(ordered, (next) => {
    setOrdered(next);
    setIsDirty(true);
  });

  function handleSaveOrder() {
    startSaving(async () => {
      const result = await reorderGalleryImages(
        galleryId,
        gallerySlug,
        ordered.map((image) => image.id)
      );
      if (result.status === "error") window.alert(result.message);
      setIsDirty(false);
      router.refresh();
    });
  }

  if (ordered.length === 0) return null;

  return (
    <div className="space-y-4">
      {isDirty && (
        <div className="flex items-center gap-4 rounded-sm border border-primary/40 bg-primary/5 px-4 py-3">
          <p className="text-xs text-foreground/70">Cambiaste el orden — no se guardó todavía.</p>
          <Button type="button" loading={isSaving} onClick={handleSaveOrder}>
            Guardar orden
          </Button>
        </div>
      )}

      {ordered.map((image, index) => (
        <div
          key={image.id}
          {...dropTargetProps(index)}
          className={cn(
            "flex items-start gap-1 transition-opacity duration-220",
            draggingIndex === index && "opacity-40",
            overIndex === index && draggingIndex !== null && draggingIndex !== index && "outline outline-2 outline-primary/60"
          )}
        >
          <DragHandle {...dragHandleProps(index)} className="mt-3" />
          <div className="flex-1">
            <GalleryImageRow image={image} galleryId={galleryId} gallerySlug={gallerySlug} />
          </div>
        </div>
      ))}
    </div>
  );
}
