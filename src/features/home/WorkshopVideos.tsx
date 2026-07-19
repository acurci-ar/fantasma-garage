import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";
import type { SiteSettings, Video } from "@/types/database";

export function WorkshopVideos({ videos, settings }: { videos: Video[]; settings: SiteSettings }) {
  const [main, ...rest] = videos;

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

      {main && (
        <div className="mt-12">
          <YouTubeFacade videoId={extractYouTubeVideoId(main.youtube_url)} title={main.title} />
          <p className="mt-3 text-sm text-foreground/60">{main.title}</p>
        </div>
      )}

      {rest.length > 0 && (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {rest.map((video) => (
            <div key={video.id}>
              <YouTubeFacade videoId={extractYouTubeVideoId(video.youtube_url)} title={video.title} />
              <p className="mt-3 text-sm text-foreground/60">{video.title}</p>
            </div>
          ))}
        </div>
      )}
    </Section>
  );
}
