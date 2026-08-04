import type { Metadata } from "next";
import { CarForm } from "@/features/admin/CarForm";
import { createCar } from "@/actions/admin/cars";

export const metadata: Metadata = { title: "Nuevo auto", robots: { index: false, follow: false } };

export default function NewCarPage() {
  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Nuevo auto</h1>
      <div className="mt-8">
        <CarForm action={createCar} submitLabel="Crear auto" />
      </div>
    </div>
  );
}
