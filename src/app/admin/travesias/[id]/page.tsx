import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TripForm } from "@/features/admin/TripForm";
import { DeleteTripButton } from "@/features/admin/TripButtons";
import { updateTrip } from "@/actions/admin/trips";
import { getTripByIdForAdmin } from "@/lib/content/trips";
import { needsUnoptimizedImage } from "@/lib/utils/image";

export const metadata: Metadata = { title: "Editar travesía", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = { draft: "Borrador", published: "Publicada", hidden: "Oculta", discontinued: "Discontinuada" };

export default async function EditTripPage({ params }: { params: { id: string } }) {
  const trip = await getTripByIdForAdmin(params.id);
  if (!trip) notFound();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <Link href="/admin/travesias" className="hover:text-primary">Travesías</Link> / Editar
          </p>
          <h1 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">{trip.title}</h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm">
            <Badge tone={trip.status === "published" ? "primary" : "default"}>{STATUS_LABEL[trip.status] ?? trip.status}</Badge>
            <Badge tone={trip.show_price ? "primary" : "default"}>{trip.show_price ? "Precio visible" : "Precio a consultar"}</Badge>
            <Link href={`/travesias/${trip.slug}`} target="_blank" className="text-xs font-semibold uppercase text-primary hover:underline">
              Ver en el sitio →
            </Link>
          </div>
        </div>
        <DeleteTripButton id={trip.id} />
      </div>

      {/* Días del itinerario */}
      <section className="mt-10 rounded-sm border border-secondary/30 bg-card/20 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-lg uppercase tracking-tight text-foreground">Itinerario día por día</h2>
            <p className="mt-1 text-sm text-foreground/60">{trip.days.length} día(s) cargado(s). Cada día es un bloque con foto en la landing.</p>
          </div>
          <Button href={`/admin/travesias/${trip.id}/dias/nuevo`} variant="secondary">Agregar día</Button>
        </div>
        {trip.days.length > 0 && (
          <ol className="mt-6 divide-y divide-secondary/20">
            {trip.days.map((day) => (
              <li key={day.id} className="flex items-center gap-4 py-3">
                <span className="relative h-12 w-20 shrink-0 overflow-hidden rounded-sm bg-card">
                  {day.image_url && (
                    <Image src={day.image_thumb_url ?? day.image_url} alt="" fill sizes="80px" className="object-cover" unoptimized={needsUnoptimizedImage(day.image_url)} />
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                    {day.day_label}{day.date_label ? ` · ${day.date_label}` : ""}
                  </p>
                  <p className="truncate text-sm text-foreground">{day.title}</p>
                </div>
                <span className="hidden text-xs text-foreground/50 sm:block">{day.distance_km ? `${day.distance_km} km` : ""}</span>
                <Link href={`/admin/travesias/${trip.id}/dias/${day.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
                  Editar
                </Link>
              </li>
            ))}
          </ol>
        )}
      </section>

      <h2 className="mt-12 font-display text-lg uppercase tracking-tight text-foreground">Datos generales</h2>
      <div className="mt-6">
        <TripForm action={updateTrip.bind(null, trip.id)} trip={trip} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
