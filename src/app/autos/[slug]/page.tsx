import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { CarVideoGrid } from "@/features/home/CarVideoGrid";
import { formatCurrency } from "@/lib/utils/format";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import { getVisibleCars, getCarBySlug } from "@/lib/content/queries";

export async function generateStaticParams() {
  const cars = await getVisibleCars();
  return cars.map((car) => ({ slug: car.slug }));
}

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const { slug } = params;
  const car = await getCarBySlug(slug);
  if (!car) return {};
  return {
    title: car.seo_title || `${car.make} ${car.model} ${car.year}`,
    description: car.seo_description || car.summary,
    openGraph: { images: [{ url: car.cover_url }] },
  };
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Borrador",
  published: "Disponible",
  hidden: "Oculto",
  discontinued: "Vendido",
};

export default async function CarPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const car = await getCarBySlug(slug);
  if (!car) notFound();

  const specs = [
    { label: "Marca", value: car.make },
    { label: "Modelo", value: car.model },
    { label: "Año", value: String(car.year) },
    car.mileage_km != null ? { label: "Kilometraje", value: `${car.mileage_km.toLocaleString("es-AR")} km` } : null,
    car.engine ? { label: "Motor", value: car.engine } : null,
    car.transmission ? { label: "Caja", value: car.transmission } : null,
    car.color ? { label: "Color", value: car.color } : null,
  ].filter((s): s is { label: string; value: string } => s !== null);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Vehicle",
    name: `${car.make} ${car.model} ${car.year}`,
    brand: car.make,
    model: car.model,
    vehicleModelDate: String(car.year),
    mileageFromOdometer: car.mileage_km ?? undefined,
    vehicleTransmission: car.transmission ?? undefined,
    image: [car.cover_url, ...car.images.map((img) => img.url)],
    offers: car.price != null ? { "@type": "Offer", priceCurrency: car.currency, price: car.price } : undefined,
  };

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative flex min-h-[60vh] items-end pt-32">
        <Image
          src={car.cover_url}
          alt={car.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
          unoptimized={needsUnoptimizedImage(car.cover_url)}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="relative z-10 mx-auto w-full max-w-content px-5 pb-14 sm:px-8 lg:px-10">
          <Badge tone="primary">{STATUS_LABEL[car.status] ?? car.status}</Badge>
          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight text-foreground sm:text-5xl">
            {car.make} {car.model}
          </h1>
          <p className="mt-2 text-lg text-foreground/70">{car.year}</p>
          <p className="mt-4 text-2xl text-primary">
            {car.price != null ? formatCurrency(car.price, car.currency) : "Consultar precio"}
          </p>
        </div>
      </div>

      <Section>
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {specs.map((spec) => (
            <div key={spec.label} className="rounded-sm border border-secondary/30 bg-card/40 p-4">
              <p className="text-xs uppercase tracking-wide text-foreground/40">{spec.label}</p>
              <p className="mt-1 text-sm text-foreground/85">{spec.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-14 max-w-2xl">
          <h2 className="font-display text-2xl uppercase tracking-tight text-foreground">Descripción</h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">{car.description ?? car.summary}</p>
        </div>

        {car.images.length > 0 && (
          <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {car.images.map((image) => {
              const src = image.thumb_url ?? image.url;
              return (
                <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-sm bg-card">
                  <Image
                    src={src}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 33vw, 50vw"
                    className="object-cover"
                    unoptimized={needsUnoptimizedImage(src)}
                  />
                </div>
              );
            })}
          </div>
        )}

        {car.videos && car.videos.length > 0 && (
          <div className="mt-14">
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Videos</h2>
            <div className="mt-6">
              <CarVideoGrid videos={car.videos} title={car.title} />
            </div>
          </div>
        )}
      </Section>
    </>
  );
}
