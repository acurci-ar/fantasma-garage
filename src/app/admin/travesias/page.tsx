import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { TripPublishToggleButton } from "@/features/admin/TripButtons";
import { formatTripDates } from "@/features/trips/tripFormat";
import { getTripsForAdmin } from "@/lib/content/trips";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatCurrency } from "@/lib/utils/format";
import { needsUnoptimizedImage } from "@/lib/utils/image";

export const metadata: Metadata = { title: "Travesías", robots: { index: false, follow: false } };

const STATUS_LABEL: Record<string, string> = { draft: "Borrador", published: "Publicada", hidden: "Oculta", discontinued: "Discontinuada" };

const columns: DataTableColumn[] = [
  { id: "travesia", header: "Travesía", sortable: true },
  { id: "fechas", header: "Fechas", sortable: true },
  { id: "precio", header: "Precio", sortable: true, align: "right" },
  { id: "dias", header: "Días", sortable: true, align: "right" },
  { id: "precio_pub", header: "Precio público", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminTravesiasPage() {
  const { trips, error } = await getTripsForAdmin();
  const publishedCount = trips.filter((t) => t.status === "published").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Travesías</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {trips.length} travesía(s), {publishedCount} publicada(s). Las publicadas se muestran en la sección Travesías
            del sitio. Que la sección y el ítem del menú aparezcan en general se activa en{" "}
            <Link href="/admin/configuracion" className="text-primary hover:underline">
              Configuración
            </Link>
            .
          </p>
        </div>
        <Button href="/admin/travesias/nuevo">Nueva travesía</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el sitio público muestra la Travesía Ruta 66 de demostración; el listado real aparece cuando esté conectado.
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-red-400/40 bg-red-400/5 p-4 text-sm text-red-300">
          No pudimos leer las travesías: {error}. ¿Está aplicada la migración <code>0023_trips.sql</code>?
        </p>
      )}

      <div className="mt-10">
        <DataTable
          columns={columns}
          rows={trips.map((trip) => {
            const dates = formatTripDates(trip.start_date, trip.end_date) ?? "—";
            const published = trip.status === "published";
            return {
              key: trip.id,
              filterText: `${trip.title} ${trip.slug} ${dates}`,
              sortValues: {
                travesia: trip.title.toLowerCase(),
                fechas: trip.start_date ?? "",
                precio: trip.price ?? 0,
                dias: trip.days.length,
                precio_pub: trip.show_price ? 1 : 0,
                estado: trip.status,
              },
              cells: {
                travesia: (
                  <div className="flex items-center gap-3">
                    <span className="relative h-10 w-16 shrink-0 overflow-hidden rounded-sm bg-card">
                      <Image src={trip.cover_thumb_url ?? trip.cover_url} alt="" fill sizes="64px" className="object-cover" unoptimized={needsUnoptimizedImage(trip.cover_url)} />
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-foreground">{trip.title}</p>
                      <p className="truncate text-xs text-foreground/50">/travesias/{trip.slug}</p>
                    </div>
                  </div>
                ),
                fechas: <span className="text-foreground/70">{dates}</span>,
                precio: <span className="text-foreground/80">{trip.price ? formatCurrency(trip.price, trip.currency) : "—"}</span>,
                dias: <span className="text-foreground/70">{trip.days.length}</span>,
                precio_pub: (
                  <Badge tone={trip.show_price ? "primary" : "default"}>{trip.show_price ? "Visible" : "A consultar"}</Badge>
                ),
                estado: <Badge tone={published ? "primary" : "default"}>{STATUS_LABEL[trip.status] ?? trip.status}</Badge>,
                acciones: (
                  <div className="flex flex-wrap items-center justify-end gap-3">
                    <TripPublishToggleButton id={trip.id} published={published} />
                    <Link href={`/travesias/${trip.slug}`} target="_blank" className="text-xs font-semibold uppercase text-foreground/60 hover:text-primary">
                      Ver
                    </Link>
                    <Link href={`/admin/travesias/${trip.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
                      Editar
                    </Link>
                  </div>
                ),
              },
            };
          })}
          emptyMessage="Todavía no hay travesías cargadas."
          searchPlaceholder="Buscar travesía..."
        />
      </div>
    </div>
  );
}
