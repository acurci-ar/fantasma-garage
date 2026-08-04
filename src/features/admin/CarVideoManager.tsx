"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { CarVideoRow } from "@/features/admin/CarVideoRow";
import { reorderCarVideos } from "@/actions/admin/cars";
import type { CarVideo } from "@/types/database";
import { useDragReorder } from "@/lib/utils/useDragReorder";
import { cn } from "@/lib/utils/cn";

function sortByPosition(videos: CarVideo[]): CarVideo[] {
  return [...videos].sort((a, b) => a.position - b.position);
}

/** Lista de videos del auto, arrastrable (ícono de agarre) para reordenar. */
export function CarVideoManager({ videos, carId }: { videos: CarVideo[]; carId: string }) {
  const [ordered, setOrdered] = useState(() => sortByPosition(videos));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isDirty) return;
    setOrdered(sortByPosition(videos));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videos]);

  const { draggingIndex, overIndex, dragHandleProps, dropTargetProps } = useDragReorder(ordered, (next) => {
    setOrdered(next);
    setIsDirty(true);
  });

  function handleSaveOrder() {
    startSaving(async () => {
      const result = await reorderCarVideos(
        carId,
        ordered.map((video) => video.id)
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

      {ordered.map((video, index) => (
        <div
          key={video.id}
          {...dropTargetProps(index)}
          className={cn(
            "flex items-start gap-1 transition-opacity duration-220",
            draggingIndex === index && "opacity-40",
            overIndex === index && draggingIndex !== null && draggingIndex !== index && "outline outline-2 outline-primary/60"
          )}
        >
          <DragHandle {...dragHandleProps(index)} className="mt-3" />
          <div className="flex-1">
            <CarVideoRow video={video} carId={carId} />
          </div>
        </div>
      ))}
    </div>
  );
}
