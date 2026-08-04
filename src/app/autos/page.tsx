import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import { formatCurrency } from "@/lib/utils/format";
import { getVisibleCars } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Autos Seleccionados",
  description: "Vehículos clásicos a la venta, restaurados o curados por Fantasma Garage.",
};

export default async function AutosPage() {
  const cars = await getVisibleCars();

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="A la venta"
        title="Autos Seleccionados"
        description="Una selección curada de clásicos, listos para su próximo dueño."
      />
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
      {cars.length === 0 && (
        <p className="mt-6 text-sm text-foreground/50">Por ahora no hay autos publicados — volvé a mirar pronto.</p>
      )}
    </Section>
  );
}
