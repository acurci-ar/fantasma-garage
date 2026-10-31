import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn } from "@/components/admin/DataTable";
import { ReservationStatusSelect } from "@/features/admin/ReservationButtons";
import { getReservationsForAdmin } from "@/lib/content/trips";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { reservationBalance, TRIP_RESERVATION_STATUS_LABEL } from "@/types/trips";

export const metadata: Metadata = { title: "Reservas", robots: { index: false, follow: false } };

const columns: DataTableColumn[] = [
  { id: "cliente", header: "Cliente", sortable: true },
  { id: "travesia", header: "Travesía", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "total", header: "Total", sortable: true, align: "right" },
  { id: "saldo", header: "Saldo", sortable: true, align: "right" },
  { id: "fecha", header: "Alta", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminReservasPage() {
  const { reservations, error } = await getReservationsForAdmin();
  const pendientes = reservations.filter((r) => r.status === "solicitada").length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Reservas</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {reservations.length} reserva(s){pendientes > 0 ? `, ${pendientes} solicitada(s) por revisar` : ""}. Las
            consultas del sitio llegan a <Link href="/admin/mensajes" className="text-primary hover:underline">Mensajes</Link>;
            desde ahí cargás la reserva acá.
          </p>
        </div>
        <Button href="/admin/reservas/nueva">Nueva reserva</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): las reservas reales aparecen cuando esté conectado.
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-sm border border-red-400/40 bg-red-400/5 p-4 text-sm text-red-300">
          No pudimos leer las reservas: {error}. ¿Está aplicada la migración <code>0024_trip_reservations.sql</code>?
        </p>
      )}

      <div className="mt-10">
        <DataTable
          columns={columns}
          rows={reservations.map((r) => {
            const { paid, balance } = reservationBalance(r);
            return {
              key: r.id,
              filterText: `${r.full_name} ${r.email} ${r.trip?.title ?? ""}`,
              sortValues: {
                cliente: r.full_name.toLowerCase(),
                travesia: r.trip?.title?.toLowerCase() ?? "",
                estado: r.status,
                total: r.total_amount,
                saldo: balance,
                fecha: r.created_at,
              },
              cells: {
                cliente: (
                  <div className="min-w-0">
                    <p className="truncate text-foreground">{r.full_name}</p>
                    <p className="truncate text-xs text-foreground/50">{r.email}</p>
                  </div>
                ),
                travesia: <span className="text-foreground/70">{r.trip?.title ?? "—"}</span>,
                estado: <ReservationStatusSelect id={r.id} status={r.status} />,
                total: <span className="text-foreground/80">{formatCurrency(r.total_amount, r.currency)}</span>,
                saldo: (
                  <span className={balance > 0 ? "text-primary" : "text-foreground/50"}>
                    {formatCurrency(balance, r.currency)}
                    {paid > 0 && balance > 0 && (
                      <span className="block text-[10px] text-foreground/40">pagó {formatCurrency(paid, r.currency)}</span>
                    )}
                  </span>
                ),
                fecha: <span className="text-foreground/60">{formatDate(r.created_at)}</span>,
                acciones: (
                  <Link href={`/admin/reservas/${r.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
                    Abrir
                  </Link>
                ),
              },
            };
          })}
          emptyMessage="Todavía no hay reservas cargadas."
          searchPlaceholder="Buscar por cliente, email o travesía..."
        />
      </div>

      <p className="mt-6 text-xs text-foreground/40">
        Estados: {Object.values(TRIP_RESERVATION_STATUS_LABEL).join(" · ")}.
      </p>
    </div>
  );
}
