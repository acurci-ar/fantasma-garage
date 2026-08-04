"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { ProductImageRow } from "@/features/admin/ProductImageRow";
import { reorderProductImages } from "@/actions/admin/products";
import type { ProductImage } from "@/types/database";
import { useDragReorder } from "@/lib/utils/useDragReorder";
import { cn } from "@/lib/utils/cn";

function sortByPosition(images: ProductImage[]): ProductImage[] {
  return [...images].sort((a, b) => a.position - b.position);
}

/** Lista de fotos del producto, arrastrable (ícono de agarre a la izquierda de cada fila) para reordenar. La primera foto es la portada que se ve en catálogo, home y ficha. */
export function ProductImageManager({ images, productId }: { images: ProductImage[]; productId: string }) {
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
      const result = await reorderProductImages(
        productId,
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
            <ProductImageRow image={image} productId={productId} isCover={index === 0} />
          </div>
        </div>
      ))}
    </div>
  );
}
