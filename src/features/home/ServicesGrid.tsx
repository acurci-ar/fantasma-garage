import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import type { Service } from "@/types/database";

export function ServicesGrid({ services }: { services: Service[] }) {
  return (
    <Section id="servicios">
      <SectionHeading
        eyebrow="Lo que hacemos"
        title="Servicios"
        description="Cada servicio se apoya en trabajo real de taller, no en íconos genéricos."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Link key={service.id} href={`/servicios#${service.slug}`} className="block">
            <EditorialCard
              image={service.image_url}
              imageAlt={service.title}
              title={service.title}
              description={service.description}
              className="aspect-[3/4]"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}
