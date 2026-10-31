import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { formatTripDates } from "@/features/trips/tripFormat";
import { getVisibleTrips } from "@/lib/content/trips";
import { formatCurrency } from "@/lib/utils/format";
import { needsUnoptimizedImage } from "@/lib/utils/image";

export const metadata: Metadata = {
  title: "Travesías",
  description:
    "Viajes premium en autos clásicos con Fantasma Garage: Ruta 66, Europa y Ruta 40. Grupos reducidos, experiencias de película y todo resuelto.",
};

export default async function TravesiasPage() {
  const trips = await getVisibleTrips();
  const published = trips.filter((t) => t.status === "published");
  const drafts = trips.filter((t) => t.status !== "published"); // solo las ve el staff (RLS)

  return (
    <div className="pt-20">
      <Section>
        <SectionHeading
          eyebrow="Travesías"
          title="Viajes en clásicos, con todo resuelto."
          description="Rutas míticas al volante de un auto de colección, grupos reducidos y experiencias que no se compran por separado. Javier “Fantasma” acompaña cada kilómetro."
        />

        {published.length === 0 ? (
          <p className="mt-12 text-foreground/60">Estamos preparando la próxima travesía. Muy pronto, novedades.</p>
        ) : (
          <div className="mt-14 space-y-10">
            {published.map((trip, i) => {
              const dates = formatTripDates(trip.start_date, trip.end_date);
              return (
                <Link
                  key={trip.id}
                  href={`/travesias/${trip.slug}`}
                  className="group grid overflow-hidden rounded-sm border border-secondary/30 bg-card/20 transition-colors duration-320 hover:border-primary/60 lg:grid-cols-12"
                >
                  <div className="relative aspect-[16/9] lg:col-span-7 lg:aspect-auto lg:min-h-[380px]">
                    <Image
                      src={trip.cover_thumb_url ?? trip.cover_url}
                      alt={trip.title}
                      fill
                      priority={i === 0}
                      sizes="(min-width: 1024px) 58vw, 100vw"
                      className="object-cover transition duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
                      unoptimized={needsUnoptimizedImage(trip.cover_url)}
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-background/40 lg:bg-gradient-to-l" />
                  </div>
                  <div className="flex flex-col justify-between p-7 lg:col-span-5 lg:p-10">
                    <div>
                      {trip.eyebrow && (
                        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{trip.eyebrow}</p>
                      )}
                      <h2 className="mt-3 font-display text-4xl uppercase leading-[0.95] tracking-tight text-foreground sm:text-5xl">
                        {trip.title}
                      </h2>
                      {trip.subtitle && (
                        <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-foreground/60">{trip.subtitle}</p>
                      )}
                      <p className="mt-5 text-base leading-relaxed text-foreground/75">{trip.summary}</p>
                    </div>
                    <div className="mt-8 flex flex-wrap items-end justify-between gap-4 border-t border-secondary/20 pt-6">
                      <div className="text-sm text-foreground/60">
                        {dates && <p>{dates}</p>}
                        {trip.duration_label && <p>{trip.duration_label}</p>}
                      </div>
                      <div className="text-right">
                        {trip.show_price && trip.price != null ? (
                          <>
                            <p className="font-display text-2xl uppercase tracking-tight text-foreground">
                              {formatCurrency(trip.price, trip.currency)}
                            </p>
                            <p className="text-[11px] uppercase tracking-wide text-foreground/50">por persona</p>
                          </>
                        ) : (
                          <Badge tone="primary">Ver detalle →</Badge>
                        )}
                      </div>
                    </div>
                    <span className="mt-6 text-xs font-semibold uppercase tracking-wide text-primary">
                      Ver la travesía →
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {drafts.length > 0 && (
          <div className="mt-16 rounded-sm border border-dashed border-secondary/40 p-6">
            <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
              Borradores (solo visibles para el staff)
            </p>
            <ul className="mt-3 flex flex-wrap gap-3">
              {drafts.map((t) => (
                <li key={t.id}>
                  <Link href={`/travesias/${t.slug}`} className="text-sm text-primary hover:underline">
                    {t.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Section>
    </div>
  );
}
