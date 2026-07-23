"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { ProjectVideoForm } from "@/features/admin/ProjectVideoForm";
import { updateProjectVideo, deleteProjectVideo } from "@/actions/admin/projects";
import type { ProjectStage, ProjectVideo } from "@/types/database";

export function ProjectVideoRow({
  video,
  projectId,
  stages = [],
}: {
  video: ProjectVideo;
  projectId: string;
  stages?: ProjectStage[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este video?")) return;
    startTransition(async () => {
      const result = await deleteProjectVideo(video.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="space-y-3">
      <ProjectVideoForm
        action={updateProjectVideo.bind(null, video.id, projectId)}
        video={video}
        stages={stages}
        submitLabel="Guardar cambios"
      />
      <button
        type="button"
        onClick={handleDelete}
        disabled={isPending}
        className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? "Eliminando..." : "Eliminar este video"}
      </button>
    </div>
  );
}
