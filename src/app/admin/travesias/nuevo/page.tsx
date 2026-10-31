import type { Metadata } from "next";
import { TripForm } from "@/features/admin/TripForm";
import { createTrip } from "@/actions/admin/trips";

export const metadata: Metadata = { title: "Nueva travesía", robots: { index: false, follow: false } };

export default function NewTripPage() {
  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Nueva travesía</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        Cargá los datos generales de la travesía. Al guardar, pasás a la edición para agregar los días del itinerario.
        Conviene crearla como <strong>Borrador</strong>: el staff la puede previsualizar en el sitio antes de publicarla.
      </p>
      <div className="mt-8">
        <TripForm action={createTrip} submitLabel="Crear travesía" />
      </div>
    </div>
  );
}
