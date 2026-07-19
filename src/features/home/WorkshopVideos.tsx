import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";
import type { SiteSettings, Video } from "@/types/database";

export function WorkshopVideos({ videos, settings }: { videos: Video[]; settings: SiteSettings }) {
  return (
    <Section id="videos">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Dentro del taller"
          title="Videos"
          description="Contenido del canal de YouTube: procesos, entregas y detalles del taller."
        />
        <div className="flex gap-3">
          <Button href={settings.youtube_channel_url} external variant="secondary">
            Ver canal
          </Button>
          <Button href={settings.youtube_playlist_url} external variant="ghost">
            Ver playlist
          </Button>
        </div>
      </div>

      {videos.length > 0 && (
        <div className="mt-12 grid grid-cols-3 gap-3 sm:gap-6">
          {videos.map((video) => (
            <div key={video.id}>
              <YouTubeFacade videoId={extractYouTubeVideoId(video.youtube_url)} title={video.title} />
              <p className="mt-3 line-clamp-2 text-sm text-foreground/60">{video.title}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
