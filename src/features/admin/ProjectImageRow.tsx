"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectImageForm } from "@/features/admin/ProjectImageForm";
import { updateProjectImage, deleteProjectImage } from "@/actions/admin/projects";
import type { ProjectImage } from "@/types/database";

export function ProjectImageRow({ image, projectId }: { image: ProjectImage; projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta imagen?")) return;
    startTransition(async () => {
      const result = await deleteProjectImage(image.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <ProjectImageForm
        action={updateProjectImage.bind(null, image.id, projectId)}
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
