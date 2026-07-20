import type { Metadata } from "next";
import { VideoForm } from "@/features/admin/VideoForm";
import { createVideo } from "@/actions/admin/videos";

export const metadata: Metadata = { title: "Nuevo video", robots: { index: false, follow: false } };

export default function NewVideoPage() {
  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Nuevo video</h1>
      <p className="mt-2 text-sm text-foreground/60">
        Para un video que todavía no está en la playlist del canal (o mientras no tengas la API configurada).
      </p>
      <div className="mt-8">
        <VideoForm action={createVideo} submitLabel="Crear" />
      </div>
    </div>
  );
}
