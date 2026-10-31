"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Barra fija inferior con precio y CTA que aparece una vez que el visitante
 * pasó el hero (así el botón de reserva siempre está a mano en una landing
 * larga, sobre todo en el celular). Respeta prefers-reduced-motion vía las
 * utilidades globales.
 */
export function TripStickyBar({
  priceLabel,
  ctaLabel,
  note,
}: {
  priceLabel: string | null;
  ctaLabel: string;
  note?: string | null;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-secondary/30 bg-background/90 backdrop-blur-md transition-transform duration-320 ease-out motion-reduce:transition-none",
        visible ? "translate-y-0" : "translate-y-full"
      )}
      aria-hidden={!visible}
    >
      <div className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-5 py-3 sm:px-8 lg:px-10">
        <div className="min-w-0">
          {priceLabel && (
            <p className="font-display text-lg uppercase leading-none tracking-tight text-foreground sm:text-xl">
              {priceLabel}
            </p>
          )}
          {note && <p className="mt-1 truncate text-[11px] text-foreground/50">{note}</p>}
        </div>
        <a
          href="#reservar"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-sm bg-primary px-5 text-sm font-semibold uppercase tracking-wide text-background transition hover:bg-primary/90"
          tabIndex={visible ? 0 : -1}
        >
          {ctaLabel}
        </a>
      </div>
    </div>
  );
}
