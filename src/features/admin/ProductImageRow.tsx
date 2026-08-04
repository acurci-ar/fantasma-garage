"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { ProductImageForm } from "@/features/admin/ProductImageForm";
import { updateProductImage, deleteProductImage } from "@/actions/admin/products";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import type { ProductImage } from "@/types/database";

export function ProductImageRow({ image, productId, isCover }: { image: ProductImage; productId: string; isCover: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    startTransition(async () => {
      const result = await deleteProductImage(image.id, productId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  const src = image.thumb_url ?? image.url;

  return (
    <div className="rounded-sm border border-secondary/30 bg-card/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="relative h-14 w-14 shrink-0 overflow-hidden rounded-sm bg-card">
            {/* draggable={false}: ver comentario equivalente en ProjectImageRow — sin esto el drag nativo del <img> pisa el reordenamiento por arrastre. */}
            <Image
              src={src}
              alt={image.alt}
              fill
              sizes="56px"
              className="object-cover"
              draggable={false}
              unoptimized={needsUnoptimizedImage(src)}
            />
          </span>
          <div className="text-sm">
            <p className="text-foreground/80">
              {image.alt || "Sin texto alternativo"}
              {isCover ? " · Portada" : ""}
            </p>
            <p className="text-xs text-foreground/40">Orden {image.position}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            {isEditing ? "Cancelar" : "Editar"}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isPending}
            className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>

      {isEditing && (
        <div className="mt-4 border-t border-secondary/20 pt-4">
          <ProductImageForm
            action={updateProductImage.bind(null, image.id, productId)}
            image={image}
            submitLabel="Guardar cambios"
          />
        </div>
      )}
    </div>
  );
}
