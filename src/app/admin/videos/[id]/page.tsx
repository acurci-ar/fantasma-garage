import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { VideoForm } from "@/features/admin/VideoForm";
import { DeleteVideoButton } from "@/features/admin/DeleteVideoButton";
import { updateVideo } from "@/actions/admin/videos";
import type { Video } from "@/types/database";

export const metadata: Metadata = { title: "Editar video", robots: { index: false, follow: false } };

export default async function EditVideoPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: video } = await supabase.from("videos").select("*").eq("id", id).single();

  if (!video) notFound();

  const typedVideo = video as Video;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedVideo.title}
        </h1>
        <DeleteVideoButton id={id} />
      </div>
      <div className="mt-8">
        <VideoForm action={updateVideo.bind(null, id)} video={typedVideo} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
