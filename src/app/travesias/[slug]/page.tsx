import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { TripHero } from "@/features/trips/TripHero";
import { TripDays } from "@/features/trips/TripDays";
import { TripRouteMap } from "@/features/trips/TripRouteMap";
import { TripIncludes } from "@/features/trips/TripIncludes";
import { TripReserveForm } from "@/features/trips/TripReserveForm";
import { TripStickyBar } from "@/features/trips/TripStickyBar";
import { formatTripDates } from "@/features/trips/tripFormat";
import { getTripBySlug, getVisibleTrips } from "@/lib/content/trips";
import { getLoggedInProfile } from "@/lib/account/getLoggedInProfile";
import { formatCurrency } from "@/lib/utils/format";
import { getSiteUrl } from "@/lib/env";
import { needsUnoptimizedImage } from "@/lib/utils/image";

export async function generateStaticParams() {
  const trips = await getVisibleTrips();
  return trips.filter((t) => t.status === "published").map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const trip = await getTripBySlug(params.slug);
  if (!trip) return {};
  return {
    title: trip.seo_title ?? trip.title,
    description: trip.seo_description ?? trip.summary,
    openGraph: { images: [{ url: trip.cover_url }] },
  };
}

export default async function TravesiaPage({ params }: { params: { slug: string } }) {
  const trip = await getTripBySlug(params.slug);
  if (!trip) notFound();

  const loggedIn = await getLoggedInProfile();
  const reserveInitialValues = loggedIn
    ? { name: loggedIn.profile?.full_name ?? "", email: loggedIn.email, phone: loggedIn.profile?.phone ?? "" }
    : undefined;

  const ctaLabel = trip.cta_label ?? "Consultar por mi lugar";
  // El precio solo se muestra si el admin lo activó en la travesía
  // (show_price). Por defecto se oculta y se informa al consultar.
  const showPrice = trip.show_price && trip.price != null;
  const priceLabel = showPrice ? `${formatCurrency(trip.price as number, trip.currency)} por persona` : null;
  const dates = formatTripDates(trip.start_date, trip.end_date);
  const totalKm = trip.days.reduce((acc, d) => acc + (d.distance_km ?? 0), 0);
  const isDraft = trip.status !== "published";

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: trip.title,
    description: trip.seo_description ?? trip.summary,
    url: `${getSiteUrl()}/travesias/${trip.slug}`,
    image: trip.cover_url,
    touristType: "Entusiastas de autos clásicos",
    itinerary: {
      "@type": "ItemList",
      itemListElement: trip.days.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: `${d.day_label}: ${d.title}` })),
    },
    ...(showPrice
      ? { offers: { "@type": "Offer", price: trip.price, priceCurrency: trip.currency, availability: "https://schema.org/LimitedAvailability" } }
      : {}),
    provider: { "@type": "Organization", name: "Fantasma Garage" },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {isDraft && (
        <div className="fixed left-1/2 top-24 z-40 -translate-x-1/2 rounded-sm border border-primary/50 bg-background/90 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-primary backdrop-blur">
          Borrador: solo visible para el staff
        </div>
      )}

      <TripHero trip={trip} />

      {/* Concepto */}
      {(trip.description || trip.highlights.length > 0) && (
        <Section className="pb-10 sm:pb-12 lg:pb-16">
          <div className="grid gap-12 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <SectionHeading eyebrow="La travesía" title="Una semana de película, al volante de un clásico." />
            </div>
            <div className="lg:col-span-7">
              {trip.description && (
                <p className="text-lg leading-relaxed text-foreground/80">{trip.description}</p>
              )}
              {trip.highlights.length > 0 && (
                <dl className="mt-10 grid gap-6 sm:grid-cols-2">
                  {trip.highlights.map((h, i) => (
                    <div key={h.label} className="border-l-2 border-primary/50 pl-5">
                      <dt className="flex items-baseline gap-3 font-display text-lg uppercase tracking-tight text-foreground">
                        <span className="text-xs text-primary">{String(i + 1).padStart(2, "0")}</span>
                        {h.label}
                      </dt>
                      <dd className="mt-2 text-sm leading-relaxed text-foreground/65">{h.detail}</dd>
                    </div>
                  ))}
                </dl>
              )}
            </div>
          </div>
        </Section>
      )}

      {/* Itinerario */}
      {trip.days.length > 0 && (
        <Section id="itinerario" className="pt-6 sm:pt-8 lg:pt-10">
          <SectionHeading
            eyebrow="Itinerario"
            title="Día por día"
            description={[dates, trip.duration_label, totalKm ? `${totalKm.toLocaleString("es-AR")} km al volante` : null]
              .filter(Boolean)
              .join(" · ")}
          />
          <TripDays days={trip.days} />
        </Section>
      )}

      {/* Mapa */}
      {trip.stops.length >= 2 && (
        <Section className="bg-card/10">
          <SectionHeading eyebrow="El recorrido" title="Mapa de la travesía" />
          <div className="mt-10">
            <TripRouteMap stops={trip.stops} title={trip.title} />
          </div>
        </Section>
      )}

      {/* Incluye */}
      {trip.includes.length > 0 && (
        <Section>
          <SectionHeading eyebrow="Todo resuelto" title="Qué incluye tu lugar" />
          <div className="mt-10">
            <TripIncludes trip={trip} />
          </div>
        </Section>
      )}

      {/* Precio + reserva */}
      <section id="reservar" className="relative overflow-hidden border-t border-secondary/20 py-20 sm:py-28">
        <Image src={trip.cover_url} alt="" fill sizes="100vw" className="object-cover opacity-20" aria-hidden="true" unoptimized={needsUnoptimizedImage(trip.cover_url)} />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/85 to-background" />
        <div className="relative mx-auto grid w-full max-w-content gap-12 px-5 sm:px-8 lg:grid-cols-12 lg:px-10">
          <div className="lg:col-span-6">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">Reservá tu lugar</p>
            {showPrice ? (
              <>
                <p className="mt-5 font-display text-6xl uppercase leading-none tracking-tight text-foreground sm:text-7xl">
                  {formatCurrency(trip.price as number, trip.currency)}
                </p>
                <p className="mt-3 text-sm uppercase tracking-wide text-foreground/60">por persona</p>
              </>
            ) : (
              <>
                <p className="mt-5 font-display text-5xl uppercase leading-none tracking-tight text-foreground sm:text-6xl">
                  Tu lugar, a medida
                </p>
                <p className="mt-4 max-w-md text-base leading-relaxed text-foreground/70">
                  Es una experiencia de grupo reducido y todo incluido. Dejanos tus datos y te pasamos el valor,
                  la disponibilidad y el detalle de pago, sin compromiso.
                </p>
              </>
            )}
            {showPrice && trip.price_note && (
              <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75">{trip.price_note}</p>
            )}
            <ul className="mt-8 space-y-2 text-sm text-foreground/70">
              {dates && <li>· Salida: {dates}</li>}
              {trip.max_participants && (
                <li>
                  · Grupo reducido: máximo {trip.max_participants} participantes
                  {trip.min_participants ? ` (mínimo ${trip.min_participants})` : ""}
                </li>
              )}
            </ul>
            <div className="mt-8">
              <Button href="/contacto" variant="secondary">
                Tengo preguntas
              </Button>
            </div>
          </div>
          <div className="rounded-sm border border-secondary/40 bg-background/80 p-6 shadow-glow backdrop-blur lg:col-span-6 lg:p-8">
            {trip.cta_url ? (
              <div className="text-center">
                <p className="text-base text-foreground/75">La reserva se gestiona en nuestra plataforma de pagos.</p>
                <div className="mt-6">
                  <Button href={trip.cta_url} external size="lg">
                    {ctaLabel}
                  </Button>
                </div>
              </div>
            ) : (
              <TripReserveForm
                tripId={trip.id}
                ctaLabel={ctaLabel}
                optionals={trip.optionals}
                initialValues={reserveInitialValues}
              />
            )}
          </div>
        </div>
      </section>

      <TripStickyBar priceLabel={priceLabel} ctaLabel={ctaLabel} note={dates} />
    </>
  );
}
