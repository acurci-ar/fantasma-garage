import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TripDayForm } from "@/features/admin/TripDayForm";
import { createTripDay } from "@/actions/admin/trips";
import { getTripByIdForAdmin } from "@/lib/content/trips";

export const metadata: Metadata = { title: "Nuevo día", robots: { index: false, follow: false } };

export default async function NewTripDayPage({ params }: { params: { id: string } }) {
  const trip = await getTripByIdForAdmin(params.id);
  if (!trip) notFound();
  const nextPosition = trip.days.length ? Math.max(...trip.days.map((d) => d.position)) + 1 : 0;

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        <Link href="/admin/travesias" className="hover:text-primary">Travesías</Link> /{" "}
        <Link href={`/admin/travesias/${trip.id}`} className="hover:text-primary">{trip.title}</Link> / Nuevo día
      </p>
      <h1 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Agregar día</h1>
      <div className="mt-8">
        <TripDayForm action={createTripDay.bind(null, trip.id)} nextPosition={nextPosition} submitLabel="Agregar día" />
      </div>
    </div>
  );
}
