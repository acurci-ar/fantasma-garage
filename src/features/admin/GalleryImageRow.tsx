"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { GalleryImageForm } from "@/features/admin/GalleryImageForm";
import { updateGalleryImage, deleteGalleryImage } from "@/actions/admin/galleries";
import type { GalleryImage } from "@/types/database";

export function GalleryImageRow({
  image,
  galleryId,
  gallerySlug,
}: {
  image: GalleryImage;
  galleryId: string;
  gallerySlug: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    startTransition(async () => {
      const result = await deleteGalleryImage(image.id, galleryId, gallerySlug);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <GalleryImageForm
        action={updateGalleryImage.bind(null, image.id, galleryId, gallerySlug)}
        image={image}
        submitLabel="Guardar cambios"
      />
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : "Eliminar esta imagen"}
      </button>
    </div>
  );
}
