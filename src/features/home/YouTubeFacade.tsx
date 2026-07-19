"use client";

import { useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

/**
 * Fachada de video: muestra una miniatura estática y solo carga el iframe
 * de YouTube al hacer click, para no penalizar LCP/INP (sección 10).
 */
export function YouTubeFacade({
  videoId,
  title,
  className,
}: {
  videoId: string | null;
  title: string;
  className?: string;
}) {
  const [loaded, setLoaded] = useState(false);

  if (loaded && videoId) {
    return (
      <div className={cn("relative aspect-video overflow-hidden rounded-sm bg-card", className)}>
        <iframe
          className="absolute inset-0 h-full w-full"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1`}
          title={title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setLoaded(true)}
      className={cn(
        "group relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-sm bg-card",
        className
      )}
      aria-label={`Reproducir video: ${title}`}
    >
      {videoId ? (
        <Image
          src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
          alt={title}
          fill
          sizes="(min-width: 1024px) 60vw, 100vw"
          className="object-cover"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/40 to-background" />
      )}
      <div className="absolute inset-0 bg-background/30 transition-colors duration-220 group-hover:bg-background/10" />
      <span className="relative flex h-16 w-16 items-center justify-center rounded-full bg-primary text-background shadow-glow transition-transform duration-220 group-hover:scale-105">
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none" aria-hidden="true">
          <path d="M7 4.5v13l12-6.5-12-6.5Z" fill="currentColor" />
        </svg>
      </span>
    </button>
  );
}
