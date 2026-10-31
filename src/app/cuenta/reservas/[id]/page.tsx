import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { getMyReservationById } from "@/lib/content/trips";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import {
  reservationBalance,
  TRIP_PAYMENT_METHOD_LABEL,
  TRIP_RESERVATION_STATUS_LABEL,
} from "@/types/trips";

export const metadata: Metadata = { title: "Mi reserva", robots: { index: false, follow: false } };

export default async function CustomerReservationPage({ params }: { params: { id: string } }) {
  if (!isSupabaseConfigured()) redirect("/cuenta");

  const reservation = await getMyReservationById(params.id);
  if (!reservation) notFound();

  const { paid, balance } = reservationBalance(reservation);
  const payments = reservation.payments ?? [];

  return (
    <Section className="pt-32">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        <Link href="/cuenta" className="hover:text-primary">Mi cuenta</Link> / Reserva
      </p>
      <SectionHeading
        eyebrow="Mi travesía"
        title={reservation.trip?.title ?? "Mi reserva"}
        description={`${reservation.participants} participante(s)`}
      />

      <div className="mt-6">
        <Badge tone="primary">{TRIP_RESERVATION_STATUS_LABEL[reservation.status]}</Badge>
      </div>

      {/* Resumen económico */}
      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-sm border border-secondary/40 bg-card/40 p-5">
          <p className="text-xs uppercase tracking-wide text-foreground/50">Total</p>
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

      {/* Opcionales */}
      {reservation.options.length > 0 && (
        <div className="mt-10">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Opcionales</h2>
          <ul className="mt-4 divide-y divide-secondary/20 rounded-sm border border-secondary/30 bg-card/30">
            {reservation.options.map((o, i) => (
              <li key={`${o.label}-${i}`} className="flex items-center justify-between gap-4 px-4 py-3 text-sm">
                <span className="text-foreground/85">{o.label}</span>
                {o.price > 0 && <span className="text-foreground/60">{formatCurrency(o.price, reservation.currency)}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Pagos */}
      <div className="mt-10">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Pagos</h2>
        {payments.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/50">Todavía no registramos pagos en tu reserva.</p>
        ) : (
          <ul className="mt-4 divide-y divide-secondary/20 rounded-sm border border-secondary/30 bg-card/30">
            {payments.map((p) => (
              <li key={p.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div>
                  <p className="text-sm text-foreground">{formatCurrency(p.amount, p.currency)}</p>
                  <p className="text-xs text-foreground/40">
                    {formatDate(p.paid_at)} · {TRIP_PAYMENT_METHOD_LABEL[p.method]}
                    {p.reference ? ` · ${p.reference}` : ""}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Notas públicas */}
      {reservation.public_notes && (
        <div className="mt-10 rounded-sm border border-primary/30 bg-primary/5 p-6">
          <h2 className="font-display text-sm uppercase tracking-wide text-primary">Notas de tu reserva</h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground/80">{reservation.public_notes}</p>
        </div>
      )}

      <div className="mt-10 text-sm text-foreground/60">
        ¿Dudas con tu reserva?{" "}
        <Link href="/contacto" className="text-primary hover:underline">Escribinos</Link>.
      </div>
    </Section>
  );
}
