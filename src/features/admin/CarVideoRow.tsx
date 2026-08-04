"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CarVideoForm } from "@/features/admin/CarVideoForm";
import { updateCarVideo, deleteCarVideo } from "@/actions/admin/cars";
import type { CarVideo } from "@/types/database";

export function CarVideoRow({ video, carId }: { video: CarVideo; carId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isEditing, setIsEditing] = useState(false);

  function handleDelete() {
    if (!window.confirm("¿Eliminar este video?")) return;
    startTransition(async () => {
      const result = await deleteCarVideo(video.id, carId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="rounded-sm border border-secondary/30 bg-card/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="text-foreground/80">{video.kind === "youtube" ? "YouTube" : "Archivo propio"}</p>
          <p className="text-xs text-foreground/40">Orden {video.position}</p>
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
          <CarVideoForm action={updateCarVideo.bind(null, video.id, carId)} video={video} submitLabel="Guardar cambios" />
        </div>
      )}
    </div>
  );
}
