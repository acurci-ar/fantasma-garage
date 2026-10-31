import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ReservationForm } from "@/features/admin/ReservationForm";
import { PaymentForm } from "@/features/admin/PaymentForm";
import { DeletePaymentButton, DeleteReservationButton } from "@/features/admin/ReservationButtons";
import { updateReservation } from "@/actions/admin/reservations";
import { getReservationByIdForAdmin, getTripsForAdmin } from "@/lib/content/trips";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import {
  reservationBalance,
  TRIP_PAYMENT_METHOD_LABEL,
  TRIP_RESERVATION_STATUS_LABEL,
} from "@/types/trips";

export const metadata: Metadata = { title: "Reserva", robots: { index: false, follow: false } };

export default async function AdminReservationDetailPage({ params }: { params: { id: string } }) {
  const [reservation, { trips }] = await Promise.all([
    getReservationByIdForAdmin(params.id),
    getTripsForAdmin(),
  ]);
  if (!reservation) notFound();

  const tripOptions = trips.map((t) => ({ id: t.id, title: t.title }));
  const { paid, balance } = reservationBalance(reservation);
  const payments = reservation.payments ?? [];

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            <Link href="/admin/reservas" className="hover:text-primary">Reservas</Link> /{" "}
            {reservation.trip?.title ?? "Reserva"}
          </p>
          <h1 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
            {reservation.full_name}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-foreground/60">
            <Badge tone="primary">{TRIP_RESERVATION_STATUS_LABEL[reservation.status]}</Badge>
            <span>{reservation.email}</span>
            {reservation.phone && <span>· {reservation.phone}</span>}
            <span>· {reservation.participants} participante(s)</span>
          </div>
        </div>
        <DeleteReservationButton id={reservation.id} />
      </div>

      {/* Resumen económico */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-secondary/40 bg-card/40 p-5">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Total acordado</p>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCurrency(reservation.total_amount, reservation.currency)}</p>
        </div>
        <div className="rounded-sm border border-secondary/40 bg-card/40 p-5">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Pagado</p>
          <p className="mt-2 font-display text-2xl text-foreground">{formatCurrency(paid, reservation.currency)}</p>
        </div>
        <div className="rounded-sm border border-primary/40 bg-primary/5 p-5">
          <p className="text-xs uppercase tracking-wide text-primary">Saldo</p>
          <p className="mt-2 font-display text-2xl text-primary">{formatCurrency(balance, reservation.currency)}</p>
        </div>
      </div>

      {/* Pagos */}
      <section className="mt-10 rounded-sm border border-secondary/30 bg-card/20 p-5 sm:p-6">
        <h2 className="font-display text-lg uppercase tracking-tight text-foreground">Pagos</h2>
        {payments.length === 0 ? (
          <p className="mt-3 text-sm text-foreground/50">Todavía no se registraron pagos.</p>
        ) : (
          <ul className="mt-4 divide-y divide-secondary/20">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div>
                  <p className="text-sm text-foreground">
                    {formatCurrency(p.amount, p.currency)}{" "}
                    <span className="text-foreground/50">· {TRIP_PAYMENT_METHOD_LABEL[p.method]}</span>
                  </p>
                  <p className="text-xs text-foreground/40">
                    {formatDate(p.paid_at)}
                    {p.reference ? ` · ${p.reference}` : ""}
                    {p.note ? ` · ${p.note}` : ""}
                  </p>
                </div>
                <DeletePaymentButton reservationId={reservation.id} paymentId={p.id} />
              </li>
            ))}
          </ul>
        )}
        <div className="mt-6 border-t border-secondary/20 pt-6">
          <h3 className="mb-4 font-display text-sm uppercase tracking-wide text-foreground/70">Registrar un pago</h3>
          <PaymentForm reservationId={reservation.id} currency={reservation.currency} />
        </div>
      </section>

      {/* Datos de la reserva */}
      <h2 className="mt-12 font-display text-lg uppercase tracking-tight text-foreground">Datos de la reserva</h2>
      <div className="mt-6">
        <ReservationForm
          action={updateReservation.bind(null, reservation.id)}
          trips={tripOptions}
          reservation={reservation}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
