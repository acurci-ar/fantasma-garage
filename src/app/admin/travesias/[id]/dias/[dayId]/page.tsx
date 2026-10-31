import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TripDayForm } from "@/features/admin/TripDayForm";
import { DeleteTripDayButton } from "@/features/admin/TripButtons";
import { updateTripDay } from "@/actions/admin/trips";
import { getTripByIdForAdmin } from "@/lib/content/trips";

export const metadata: Metadata = { title: "Editar día", robots: { index: false, follow: false } };

export default async function EditTripDayPage({ params }: { params: { id: string; dayId: string } }) {
  const trip = await getTripByIdForAdmin(params.id);
  const day = trip?.days.find((d) => d.id === params.dayId);
  if (!trip || !day) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <Link href="/admin/travesias" className="hover:text-primary">Travesías</Link> /{" "}
            <Link href={`/admin/travesias/${trip.id}`} className="hover:text-primary">{trip.title}</Link> / {day.day_label}
          </p>
          <h1 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">{day.title}</h1>
        </div>
        <DeleteTripDayButton tripId={trip.id} dayId={day.id} />
      </div>
      <div className="mt-8">
        <TripDayForm action={updateTripDay.bind(null, trip.id, day.id)} day={day} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
