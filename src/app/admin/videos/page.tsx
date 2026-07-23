import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { YouTubeFacade } from "@/features/home/YouTubeFacade";
import { VideoFeaturedToggleButton } from "@/features/admin/VideoFeaturedToggleButton";
import { PlaylistVideoPicker } from "@/features/admin/PlaylistVideoPicker";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
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

const allVideosColumns: DataTableColumn[] = [
  { id: "titulo", header: "Título", sortable: true },
  { id: "origen", header: "Origen", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

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
        <div className="mt-4">
          <DataTable
            columns={allVideosColumns}
            rows={videos.map((video) => {
              const origin = video.source === "playlist" ? "Playlist" : "Manual";
              return {
                key: video.id,
                filterText: `${video.title} ${origin}`,
                sortValues: {
                  titulo: video.title.toLowerCase(),
                  origen: origin,
                  estado: video.featured ? 1 : 0,
                },
                cells: {
                  titulo: <span className="text-foreground">{video.title}</span>,
                  origen: <span className="text-foreground/60">{origin}</span>,
                  estado: (
                    <Badge tone={video.featured ? "primary" : "default"}>
                      {video.featured ? "Destacado" : "No destacado"}
                    </Badge>
                  ),
                  acciones: (
                    <Link href={`/admin/videos/${video.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
                      Editar
                    </Link>
                  ),
                },
              };
            })}
            emptyMessage="Todavía no hay videos cargados."
            searchPlaceholder="Buscar video..."
          />
        </div>
      </div>
    </div>
  );
}
