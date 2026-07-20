/**
 * Playlist automática (YouTube Data API v3), para la sección /videos
 * ("Dentro del taller"). Usa la playlist ya configurada en site_settings
 * (youtube_playlist_url) en vez de todo el canal: es más simple (no hay que
 * resolver el @handle a un canal y de ahí a su lista de "subidos") y evita
 * traer contenido no relacionado al taller que pueda estar en el canal.
 */

export function extractPlaylistId(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("list");
  } catch {
    return null;
  }
}

export interface PlaylistVideo {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  publishedAt: string;
}

const PRIVATE_OR_DELETED_TITLES = new Set(["Private video", "Deleted video"]);

/**
 * Trae los videos de una playlist pública, paginando hasta maxPages páginas
 * de 50 (por defecto hasta 200 videos, de sobra para un canal de taller).
 * Se cachea con el fetch cache de Next (revalidate) para no gastar cuota de
 * la API ni volver a pegarle en cada visita a la página.
 */
export async function fetchPlaylistVideos(
  playlistId: string,
  apiKey: string,
  maxPages = 4
): Promise<PlaylistVideo[]> {
  const videos: PlaylistVideo[] = [];
  let pageToken: string | undefined;

  for (let page = 0; page < maxPages; page++) {
    const url = new URL("https://www.googleapis.com/youtube/v3/playlistItems");
    url.searchParams.set("part", "snippet");
    url.searchParams.set("maxResults", "50");
    url.searchParams.set("playlistId", playlistId);
    url.searchParams.set("key", apiKey);
    if (pageToken) url.searchParams.set("pageToken", pageToken);

    const res = await fetch(url.toString(), { next: { revalidate: 3600 } });
    if (!res.ok) {
      throw new Error(`YouTube API respondió ${res.status}`);
    }
    const data = (await res.json()) as {
      items?: Array<{
        snippet?: {
          title?: string;
          publishedAt?: string;
          resourceId?: { videoId?: string };
          thumbnails?: { medium?: { url?: string }; default?: { url?: string } };
        };
      }>;
      nextPageToken?: string;
    };

    for (const item of data.items ?? []) {
      const snippet = item.snippet;
      const videoId = snippet?.resourceId?.videoId;
      const title = snippet?.title;
      if (!videoId || !title || PRIVATE_OR_DELETED_TITLES.has(title)) continue;

      videos.push({
        videoId,
        title,
        thumbnailUrl: snippet?.thumbnails?.medium?.url ?? snippet?.thumbnails?.default?.url ?? "",
        publishedAt: snippet?.publishedAt ?? "",
      });
    }

    pageToken = data.nextPageToken;
    if (!pageToken) break;
  }

  return videos;
}
