"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteVideo } from "@/actions/admin/videos";

export function DeleteVideoButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este video? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deleteVideo(id);
      if (result.status === "success") {
        router.push("/admin/videos");
        router.refresh();
      } else {
        window.alert(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Eliminando..." : "Eliminar video"}
    </button>
  );
}
