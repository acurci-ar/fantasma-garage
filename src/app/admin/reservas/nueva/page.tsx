import type { Metadata } from "next";
import Link from "next/link";
import { ReservationForm } from "@/features/admin/ReservationForm";
import { createReservation } from "@/actions/admin/reservations";
import { getTripsForAdmin } from "@/lib/content/trips";

export const metadata: Metadata = { title: "Nueva reserva", robots: { index: false, follow: false } };

export default async function NewReservationPage() {
  const { trips } = await getTripsForAdmin();
  const tripOptions = trips.map((t) => ({ id: t.id, title: t.title }));

  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
        <Link href="/admin/reservas" className="hover:text-primary">Reservas</Link> / Nueva
      </p>
      <h1 className="mt-1 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Nueva reserva</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        Cargá la reserva a partir de la consulta del cliente. Usá su email real: así, cuando se registre con ese
        mismo email, ve su reserva, pagos y saldo desde “Mi cuenta”. Los pagos se cargan después, al abrir la reserva.
      </p>
      {tripOptions.length === 0 ? (
        <p className="mt-8 rounded-sm border border-secondary/30 bg-card/30 p-4 text-sm text-foreground/60">
          No hay travesías cargadas todavía. Creá una primero en{" "}
          <Link href="/admin/travesias/nuevo" className="text-primary hover:underline">Travesías</Link>.
        </p>
      ) : (
        <div className="mt-8">
          <ReservationForm action={createReservation} trips={tripOptions} submitLabel="Crear reserva" />
        </div>
      )}
    </div>
  );
}
