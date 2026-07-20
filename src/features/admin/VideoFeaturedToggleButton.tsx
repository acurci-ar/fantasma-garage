"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleVideoFeatured } from "@/actions/admin/videos";

export function VideoFeaturedToggleButton({ id, featured }: { id: string; featured: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleClick() {
    startTransition(async () => {
      const result = await toggleVideoFeatured(id, !featured);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-primary transition-colors duration-220 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {featured ? "Quitar de destacados" : "Destacar"}
    </button>
  );
}
