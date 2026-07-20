import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";
import { getChannelPlaylistVideos, getFeaturedVideos, getSiteSettings } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Videos",
  description: "Dentro del taller: procesos, entregas y detalles documentados en video.",
};

export default async function VideosPage() {
  const [settings, playlistVideos, featuredVideos] = await Promise.all([
    getSiteSettings(),
    getChannelPlaylistVideos(),
    getFeaturedVideos(),
  ]);

  // Con YOUTUBE_API_KEY configurada se muestra la playlist completa del
  // canal (ver lib/youtube/playlist.ts); si no, cae a los mismos videos
  // destacados que la home, como ya funcionaba antes de tener la API.
  const items =
    playlistVideos !== null
      ? playlistVideos.map((v) => ({ key: v.videoId, videoId: v.videoId, title: v.title }))
      : featuredVideos.map((v) => ({ key: v.id, videoId: extractYouTubeVideoId(v.youtube_url), title: v.title }));

  const jsonLdItems = items
    .map(({ videoId, title }) => {
      if (!videoId) return null;
      return {
        "@context": "https://schema.org",
        "@type": "VideoObject",
        name: title,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
        uploadDate: undefined,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
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
          description={
            playlistVideos !== null
              ? "Todos los videos de la playlist del canal: procesos, entregas y detalles del taller."
              : "Contenido del canal de YouTube: procesos, entregas y detalles del taller."
          }
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
        {items.map((item) => (
          <div key={item.key}>
            <YouTubeFacade videoId={item.videoId} title={item.title} />
            <p className="mt-3 text-sm text-foreground/60">{item.title}</p>
          </div>
        ))}
      </div>
      {items.length === 0 && (
        <p className="mt-6 text-sm text-foreground/50">
          Todavía no hay videos cargados. Configurá la playlist automática (YOUTUBE_API_KEY) o cargá videos
          destacados manuales desde /admin/videos.
        </p>
      )}
    </Section>
  );
}
