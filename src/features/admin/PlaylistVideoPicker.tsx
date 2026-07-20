"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { featureFromPlaylist } from "@/actions/admin/videos";
import type { PlaylistVideo } from "@/lib/youtube/playlist";

/**
 * Elegir destacados directo desde la playlist en vivo del canal, en vez de
 * tipear título/URL a mano: evita typos y que se desincronice con lo que
 * realmente hay en YouTube (ver conversación sobre /admin/videos).
 */
export function PlaylistVideoPicker({
  videos,
  featuredUrls,
  atLimit,
}: {
  videos: PlaylistVideo[];
  featuredUrls: Set<string>;
  atLimit: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleFeature(video: PlaylistVideo) {
    startTransition(async () => {
      const result = await featureFromPlaylist(video.videoId, video.title, video.thumbnailUrl);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  if (videos.length === 0) {
    return <p className="text-sm text-foreground/50">La playlist no tiene videos (o todavía no cargó).</p>;
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {videos.map((video) => {
        const isFeatured = featuredUrls.has(`https://www.youtube.com/watch?v=${video.videoId}`);
        const disabled = isPending || isFeatured || (atLimit && !isFeatured);
        return (
          <div key={video.videoId} className="rounded-sm border border-secondary/30 bg-card/40 p-3">
            <div className="relative aspect-video overflow-hidden rounded-sm bg-card">
              {video.thumbnailUrl && (
                <Image
                  src={video.thumbnailUrl}
                  alt={video.title}
                  fill
                  sizes="(min-width: 1024px) 30vw, 90vw"
                  className="object-cover"
                />
              )}
            </div>
            <p className="mt-2 line-clamp-2 text-sm text-foreground/70">{video.title}</p>
            <button
              type="button"
              onClick={() => handleFeature(video)}
              disabled={disabled}
              className="mt-2 text-xs font-semibold uppercase tracking-wide text-primary transition-colors duration-220 hover:underline disabled:cursor-not-allowed disabled:text-foreground/40 disabled:no-underline"
            >
              {isFeatured ? "Ya destacado" : "Destacar"}
            </button>
          </div>
        );
      })}
    </div>
  );
}
