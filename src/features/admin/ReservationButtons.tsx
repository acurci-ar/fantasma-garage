"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deletePayment, deleteReservation, updateReservationStatus } from "@/actions/admin/reservations";
import { TRIP_RESERVATION_STATUS_LABEL, type TripReservationStatus } from "@/types/trips";

const STATUSES: TripReservationStatus[] = ["solicitada", "lista_espera", "confirmada", "senada", "pagada", "cancelada"];

export function ReservationStatusSelect({ id, status }: { id: string; status: TripReservationStatus }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <select
      aria-label="Cambiar estado"
      defaultValue={status}
      disabled={isPending}
      onChange={(e) => {
        const value = e.target.value;
        startTransition(async () => {
          const r = await updateReservationStatus(id, value);
          if (r.status === "error") window.alert(r.message);
          router.refresh();
        });
      }}
      className="rounded-sm border border-secondary/50 bg-background/60 px-3 py-2 text-xs text-foreground focus:border-primary focus:outline-none disabled:opacity-50"
    >
      {STATUSES.map((s) => (
        <option key={s} value={s}>
          {TRIP_RESERVATION_STATUS_LABEL[s]}
        </option>
      ))}
    </select>
  );
}

export function DeleteReservationButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => {
        if (!window.confirm("¿Eliminar esta reserva y sus pagos? Esta acción no se puede deshacer.")) return;
        startTransition(async () => {
          const r = await deleteReservation(id);
          if (r.status === "success") {
            router.push("/admin/reservas");
            router.refresh();
          } else window.alert(r.message);
        });
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar reserva"}
    </button>
  );
}

export function DeletePaymentButton({ reservationId, paymentId }: { reservationId: string; paymentId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
      onClick={() => {
        if (!window.confirm("¿Eliminar este pago?")) return;
        startTransition(async () => {
          const r = await deletePayment(reservationId, paymentId);
          if (r.status === "error") window.alert(r.message);
          router.refresh();
        });
      }}
    >
      {isPending ? "..." : "Eliminar"}
    </button>
  );
}
