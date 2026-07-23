import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";
import type { ProjectVideo } from "@/types/database";

/** Videos públicos del proyecto (ya vienen filtrados por RLS: privados y de proyectos privados no llegan acá). */
export function ProjectVideoGrid({ videos, title }: { videos: ProjectVideo[]; title: string }) {
  if (videos.length === 0) return null;

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {videos.map((video) =>
        video.kind === "youtube" ? (
          <YouTubeFacade key={video.id} videoId={extractYouTubeVideoId(video.youtube_url ?? "")} title={title} />
        ) : (
          <video key={video.id} controls className="aspect-video w-full rounded-sm bg-card object-cover">
            <source src={video.video_url ?? ""} />
          </video>
        )
      )}
    </div>
  );
}
