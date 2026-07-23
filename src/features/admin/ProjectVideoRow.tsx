"use client";

import { useState, useTransition } from "react";
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
  const [isEditing, setIsEditing] = useState(false);

  function handleDelete() {
    if (!window.confirm("¿Eliminar este video?")) return;
    startTransition(async () => {
      const result = await deleteProjectVideo(video.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  const stageName = stages.find((s) => s.id === video.stage_id)?.name;

  return (
    <div className="rounded-sm border border-secondary/30 bg-card/40 p-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm">
          <p className="text-foreground/80">
            {video.kind === "youtube" ? "YouTube" : "Archivo propio"}
            {stageName ? ` · ${stageName}` : ""}
          </p>
          <p className="text-xs text-foreground/40">
            Orden {video.position} · {video.visibility === "private" ? "Privado" : "Público"}
          </p>
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
          <ProjectVideoForm
            action={updateProjectVideo.bind(null, video.id, projectId)}
            video={video}
            stages={stages}
            submitLabel="Guardar cambios"
          />
        </div>
      )}
    </div>
  );
}
