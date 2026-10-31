"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteTrip, deleteTripDay, toggleTripPublished } from "@/actions/admin/trips";

const linkClasses =
  "text-xs font-semibold uppercase tracking-wide transition-colors duration-220 disabled:cursor-not-allowed disabled:opacity-50";

export function DeleteTripButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      className={`${linkClasses} text-red-400 hover:text-red-300`}
      onClick={() => {
        if (!window.confirm("¿Eliminar esta travesía y todos sus días? Esta acción no se puede deshacer.")) return;
        startTransition(async () => {
          const r = await deleteTrip(id);
          if (r.status === "success") {
            router.push("/admin/travesias");
            router.refresh();
          } else window.alert(r.message);
        });
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar travesía"}
    </button>
  );
}

export function DeleteTripDayButton({ tripId, dayId }: { tripId: string; dayId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      className={`${linkClasses} text-red-400 hover:text-red-300`}
      onClick={() => {
        if (!window.confirm("¿Eliminar este día del itinerario?")) return;
        startTransition(async () => {
          const r = await deleteTripDay(tripId, dayId);
          if (r.status === "success") {
            router.push(`/admin/travesias/${tripId}`);
            router.refresh();
          } else window.alert(r.message);
        });
      }}
    >
      {isPending ? "Eliminando..." : "Eliminar día"}
    </button>
  );
}

export function TripPublishToggleButton({ id, published }: { id: string; published: boolean }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={isPending}
      className={`${linkClasses} ${published ? "text-foreground/60 hover:text-primary" : "text-primary hover:underline"}`}
      onClick={() =>
        startTransition(async () => {
          const r = await toggleTripPublished(id, !published);
          if (r.status === "error") window.alert(r.message);
          router.refresh();
        })
      }
    >
      {isPending ? "..." : published ? "Pasar a borrador" : "Publicar"}
    </button>
  );
}
