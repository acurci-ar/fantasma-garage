"use client";

import { useState } from "react";
import Image from "next/image";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import { cn } from "@/lib/utils/cn";
import type { ProductImage } from "@/types/database";

/** Foto principal + tira de miniaturas clickeables, para la ficha pública de producto (permite ver todas las fotos cargadas, no solo la portada). */
export function ProductGallery({ images, outOfStock }: { images: ProductImage[]; outOfStock: boolean }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const active = images[activeIndex] ?? images[0];

  return (
    <div>
      <div className="relative aspect-square overflow-hidden rounded-sm bg-card">
        {active && (
          <Image
            src={active.url}
            alt={active.alt}
            fill
            sizes="(min-width: 1024px) 50vw, 100vw"
            className="object-cover"
            priority
            unoptimized={needsUnoptimizedImage(active.url)}
          />
        )}
        {outOfStock && (
          <span className="absolute left-4 top-4 rounded-sm bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
            A pedido
          </span>
        )}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-2">
          {images.map((image, index) => (
            <button
              key={image.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              aria-label={`Ver foto ${index + 1}`}
              aria-current={index === activeIndex}
              className={cn(
                "relative h-16 w-16 shrink-0 overflow-hidden rounded-sm border transition-colors duration-220",
                index === activeIndex ? "border-primary" : "border-secondary/30 hover:border-secondary/60"
              )}
            >
              <Image
                src={image.thumb_url ?? image.url}
                alt={image.alt}
                fill
                sizes="64px"
                className="object-cover"
                unoptimized={needsUnoptimizedImage(image.thumb_url ?? image.url)}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
