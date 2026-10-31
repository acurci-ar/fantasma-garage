import Image from "next/image";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { formatTripDates } from "@/features/trips/tripFormat";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import type { Trip } from "@/types/trips";

/**
 * Bloque "Travesías" de la home. Aparece solo si la sección está activada a
 * nivel sitio (site_settings.travesias_enabled, chequeado en la home) y hay
 * al menos una travesía publicada.
 */
export function FeaturedTravesias({ trips }: { trips: Trip[] }) {
  if (trips.length === 0) return null;

  return (
    <Section id="travesias" className="bg-card/10">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Nuevo · Travesías"
          title="Viajes en autos clásicos"
          description="Rutas míticas al volante de un clásico, en grupos reducidos y con todo resuelto. Javier “Fantasma” acompaña cada kilómetro."
        />
        <Button href="/travesias" variant="ghost">
          Ver todas →
        </Button>
      </div>

      <div className="mt-12 space-y-6">
        {trips.map((trip, i) => {
          const dates = formatTripDates(trip.start_date, trip.end_date);
          return (
            <Link
              key={trip.id}
              href={`/travesias/${trip.slug}`}
              className="group grid overflow-hidden rounded-sm border border-secondary/30 bg-background/40 transition-colors duration-320 hover:border-primary/60 lg:grid-cols-2"
            >
              <div className="relative aspect-[16/9] lg:aspect-auto lg:min-h-[280px]">
                <Image
                  src={trip.cover_thumb_url ?? trip.cover_url}
                  alt={trip.title}
                  fill
                  priority={i === 0}
                  sizes="(min-width: 1024px) 50vw, 100vw"
                  className="object-cover transition duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.03]"
                  unoptimized={needsUnoptimizedImage(trip.cover_url)}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent lg:bg-gradient-to-r" />
              </div>
              <div className="flex flex-col justify-center p-7 lg:p-10">
                {trip.eyebrow && (
                  <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{trip.eyebrow}</p>
                )}
                <h3 className="mt-3 font-display text-3xl uppercase leading-[0.95] tracking-tight text-foreground sm:text-4xl">
                  {trip.title}
                </h3>
                {trip.subtitle && (
                  <p className="mt-3 text-xs font-medium uppercase tracking-[0.18em] text-foreground/60">{trip.subtitle}</p>
                )}
                <p className="mt-4 text-base leading-relaxed text-foreground/75">{trip.summary}</p>
                <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-foreground/55">
                  {dates && <span>{dates}</span>}
                  {trip.duration_label && <span>· {trip.duration_label}</span>}
                </div>
                <span className="mt-6 text-xs font-semibold uppercase tracking-wide text-primary">
                  Ver la travesía →
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </Section>
  );
}
