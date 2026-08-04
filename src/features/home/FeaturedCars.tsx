import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import type { Car } from "@/types/database";

/** Últimos autos publicados (ver getVisibleCars(3) en page.tsx) — no hay flag "destacado" acá, a diferencia de Productos/Proyectos: la sección siempre muestra los 3 más recientes. */
export function FeaturedCars({ cars }: { cars: Car[] }) {
  if (cars.length === 0) return null;

  return (
    <Section id="autos">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="A la venta"
          title="Autos Seleccionados"
          description="Los últimos clásicos incorporados a la selección."
        />
        <Button href="/autos" variant="ghost">
          Ver todos →
        </Button>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {cars.map((car) => (
          <Link key={car.id} href={`/autos/${car.slug}`} className="block">
            <EditorialCard
              image={car.cover_thumb_url ?? car.cover_url}
              imageAlt={`${car.make} ${car.model} ${car.year}`}
              eyebrow={`${car.make} · ${car.year}`}
              title={car.model}
              description={car.summary}
            >
              <p className="mt-3 text-sm font-semibold text-primary">
                {car.price != null ? formatCurrency(car.price, car.currency) : "Consultar precio"}
              </p>
            </EditorialCard>
          </Link>
        ))}
      </div>
    </Section>
  );
}
