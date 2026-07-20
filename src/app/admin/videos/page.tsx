import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { VideoFeaturedToggleButton } from "@/features/admin/VideoFeaturedToggleButton";
import { PlaylistVideoPicker } from "@/features/admin/PlaylistVideoPicker";
import { extractYouTubeVideoId } from "@/lib/utils/youtube";
import { getChannelPlaylistVideos } from "@/lib/content/queries";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Video } from "@/types/database";

export const metadata: Metadata = { title: "Videos", robots: { index: false, follow: false } };

const MAX_FEATURED = 3;

async function getVideos(): Promise<Video[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("videos")
    .select("*")
    .order("featured", { ascending: false })
    .order("position", { ascending: true });
  return (data ?? []) as Video[];
}

export default async function AdminVideosPage() {
  const [videos, playlistVideos] = await Promise.all([getVideos(), getChannelPlaylistVideos()]);

  const featured = videos.filter((v) => v.featured);
  const featuredUrls = new Set(featured.map((v) => v.youtube_url));
  const atLimit = featured.length >= MAX_FEATURED;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Videos</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {featured.length}/{MAX_FEATURED} destacados en la home. {videos.length} video(s) cargado(s) en total.
          </p>
        </div>
        <Button href="/admin/videos/nuevo">Agregar manualmente</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      <div className="mt-10">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
          Destacados en la home
        </h2>
        {featured.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/50">Todavía no hay videos destacados.</p>
        ) : (
          <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((video) => (
              <div key={video.id} className="rounded-sm border border-secondary/30 bg-card/40 p-3">
                <YouTubeFacade videoId={extractYouTubeVideoId(video.youtube_url)} title={video.title} />
                <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{video.title}</p>
                <div className="mt-2 flex items-center justify-between gap-3">
                  <Link
                    href={`/admin/videos/${video.id}`}
                    className="text-xs font-semibold uppercase text-primary hover:underline"
                  >
                    Editar
                  </Link>
                  <VideoFeaturedToggleButton id={video.id} featured={video.featured} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
          Elegir de la playlist del canal
        </h2>
        {playlistVideos === null ? (
          <p className="mt-4 max-w-2xl text-sm text-foreground/50">
            Configurá <code className="text-foreground/70">YOUTUBE_API_KEY</code> (y verificá que
            youtube_playlist_url en la configuración del sitio apunte a la playlist correcta) para elegir
            destacados directo de acá, sin tipear título ni URL a mano. Mientras tanto podés cargarlos
            manualmente abajo.
          </p>
        ) : (
          <div className="mt-4">
            <PlaylistVideoPicker videos={playlistVideos} featuredUrls={featuredUrls} atLimit={atLimit} />
          </div>
        )}
      </div>

      <div className="mt-12">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Todos los videos cargados</h2>
        {videos.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/50">Todavía no hay videos cargados.</p>
        ) : (
          <div className="mt-4 overflow-x-auto rounded-sm border border-secondary/30">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
                <tr>
                  <th className="px-4 py-3 font-semibold">Título</th>
                  <th className="px-4 py-3 font-semibold">Origen</th>
                  <th className="px-4 py-3 font-semibold">Estado</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-secondary/15">
                {videos.map((video) => (
                  <tr key={video.id} className="hover:bg-card/30">
                    <td className="px-4 py-3 text-foreground">{video.title}</td>
                    <td className="px-4 py-3 text-foreground/60">
                      {video.source === "playlist" ? "Playlist" : "Manual"}
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={video.featured ? "primary" : "default"}>
                        {video.featured ? "Destacado" : "No destacado"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/videos/${video.id}`}
                        className="text-xs font-semibold uppercase text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
