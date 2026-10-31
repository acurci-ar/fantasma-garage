import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import { formatCurrency } from "@/lib/utils/format";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import { formatTripDates } from "@/features/trips/tripFormat";
import type { Trip } from "@/types/trips";

export function TripHero({ trip }: { trip: Trip }) {
  const dates = formatTripDates(trip.start_date, trip.end_date);
  const facts: { label: string; value: string }[] = [];
  if (dates) facts.push({ label: "Fechas", value: dates });
  if (trip.duration_label) facts.push({ label: "Duración", value: trip.duration_label });
  // El precio solo se muestra si el admin lo activó (show_price); si no, se
  // informa al consultar.
  if (trip.show_price && trip.price != null)
    facts.push({ label: "Precio", value: `${formatCurrency(trip.price, trip.currency)} p/p` });
  if (trip.max_participants) facts.push({ label: "Cupos", value: `${trip.max_participants} lugares` });

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-background pt-20">
      <Image
        src={trip.cover_url}
        alt={trip.title}
        fill
        priority
        sizes="100vw"
        className="object-cover"
        unoptimized={needsUnoptimizedImage(trip.cover_url)}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
      <div className="absolute inset-0 bg-gradient-to-r from-background/80 via-background/20 to-transparent" />
      <div className="absolute inset-0 bg-fade-radial" />

      <div className="relative z-10 flex flex-1 items-end pb-14 pt-10 sm:items-center sm:pb-20">
        <Container>
          <div className="max-w-2xl">
            {trip.eyebrow && (
              <p className="mb-4 inline-flex items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
                <span className="h-px w-8 bg-primary" aria-hidden="true" />
                {trip.eyebrow}
              </p>
            )}
            <h1 className="font-display text-5xl uppercase leading-[0.92] tracking-tight text-foreground sm:text-7xl lg:text-8xl">
              {trip.title}
            </h1>
            {trip.subtitle && (
              <p className="mt-5 text-sm font-medium uppercase tracking-[0.18em] text-foreground/70 sm:text-base">
                {trip.subtitle}
              </p>
            )}
            <p className="mt-6 max-w-xl text-base leading-relaxed text-foreground/80 sm:text-lg">{trip.summary}</p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="#reservar" size="lg">
                {trip.cta_label ?? "Reservar mi lugar"}
              </Button>
              <Button href="#itinerario" variant="secondary" size="lg">
                Ver itinerario
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {facts.length > 0 && (
        <div className="relative z-10 border-t border-secondary/20 bg-background/70 backdrop-blur-sm">
          <Container className="grid grid-cols-2 gap-x-6 gap-y-4 py-6 sm:grid-cols-4">
            {facts.map((fact) => (
              <div key={fact.label}>
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-foreground/50">{fact.label}</p>
                <p className="mt-1 font-display text-lg uppercase tracking-tight text-foreground sm:text-xl">
                  {fact.value}
                </p>
              </div>
            ))}
          </Container>
        </div>
      )}

      {trip.cover_credit && (
        <p className="absolute bottom-28 right-4 z-10 hidden text-[10px] uppercase tracking-wide text-foreground/35 sm:block">
          Foto: {trip.cover_credit}
        </p>
      )}
    </section>
  );
}
