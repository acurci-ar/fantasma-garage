import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";
import { getFeaturedVideos, getSiteSettings } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Videos",
  description: "Dentro del taller: procesos, entregas y detalles documentados en video.",
};

export default async function VideosPage() {
  const [videos, settings] = await Promise.all([getFeaturedVideos(), getSiteSettings()]);

  const jsonLdItems = videos
    .map((video) => {
      const id = extractYouTubeVideoId(video.youtube_url);
      if (!id) return null;
      return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: video.title,
        thumbnailUrl: `https://i.ytimg.com/vi/${id}/hqdefault.jpg`,
        uploadDate: undefined,
        embedUrl: `https://www.youtube-nocookie.com/embed/${id}`,
      };
    })
    .filter(Boolean);

  return (
    <Section className="pt-32">
      {jsonLdItems.map((item, i) => (
        <script
          key={i}
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(item) }}
        />
      ))}
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

      <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
        {videos.map((video) => (
          <div key={video.id}>
            <YouTubeFacade videoId={extractYouTubeVideoId(video.youtube_url)} title={video.title} />
            <p className="mt-3 text-sm text-foreground/60">{video.title}</p>
          </div>
        ))}
      </div>
      {videos.length === 0 && (
        <p className="mt-6 text-sm text-foreground/50">
          Todavía no hay videos destacados cargados. Configurá la playlist automática o cargá videos
          manuales desde /admin.
        </p>
      )}
    </Section>
  );
}
