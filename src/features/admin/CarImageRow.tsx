"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { CarImageForm } from "@/features/admin/CarImageForm";
import { updateCarImage, deleteCarImage } from "@/actions/admin/cars";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import type { CarImage } from "@/types/database";

export function CarImageRow({ image, carId }: { image: CarImage; carId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    startTransition(async () => {
      const result = await deleteCarImage(image.id, carId);
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
            <p className="text-foreground/80">{image.alt || "Sin texto alternativo"}</p>
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
          <CarImageForm action={updateCarImage.bind(null, image.id, carId)} image={image} submitLabel="Guardar cambios" />
        </div>
      )}
    </div>
  );
}
