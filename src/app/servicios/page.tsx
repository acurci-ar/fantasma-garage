import type { Metadata } from "next";
import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { getServices } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Servicios",
  description:
    "Restauración integral, mecánica y chapa y pintura para autos clásicos y muscle cars.",
};

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasmagarage.com";

export default async function ServiciosPage() {
  const services = await getServices();

  /**
   * Cada servicio publicado como entidad Service (schema.org), ligada al
   * negocio vía @id — la misma referencia que arma el LocalBusiness en
   * layout.tsx. Da a los motores de IA la lista concreta de qué servicios
   * ofrecemos, en vez de tener que inferirla del texto suelto de la página.
   */
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": services.map((service) => ({
      "@type": "Service",
      name: service.title,
      description: service.description,
      url: `${SITE_URL}/servicios#${service.slug}`,
      image: service.image_url.startsWith("http") ? service.image_url : `${SITE_URL}${service.image_url}`,
      provider: { "@id": `${SITE_URL}/#business` },
      areaServed: { "@type": "Country", name: "Argentina" },
    })),
  };

  return (
    <Section className="pt-32">
      {services.length > 0 && (
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <SectionHeading
        eyebrow="Alcance de trabajo"
        title="Servicios"
        description="Cada servicio incluye diagnóstico, presupuesto y seguimiento documentado del proceso."
      />

      <div className="mt-14 space-y-16">
        {services.map((service, index) => (
          <article
            key={service.id}
            id={service.slug}
            className={`grid scroll-mt-28 gap-8 lg:grid-cols-2 lg:items-center ${
              index % 2 === 1 ? "lg:[&>*:first-child]:order-2" : ""
            }`}
          >
            <div className="relative aspect-[4/3] overflow-hidden rounded-sm bg-card">
              <Image src={service.image_url} alt={service.title} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" />
            </div>
            <div>
              <h2 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
                {service.title}
              </h2>
              <p className="mt-4 text-base leading-relaxed text-foreground/70">{service.description}</p>
              <div className="mt-6">
                <Button href="/contacto" variant="secondary">
                  Consultar por este servicio
                </Button>
              </div>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
