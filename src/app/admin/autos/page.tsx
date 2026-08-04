import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Car } from "@/types/database";

export const metadata: Metadata = { title: "Autos Seleccionados", robots: { index: false, follow: false } };

async function getCars(): Promise<Car[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("cars").select("*, images:car_images(*)").order("created_at", { ascending: false });
  return (data ?? []) as Car[];
}

const statusLabel: Record<string, string> = {
  draft: "Borrador",
  published: "Publicado",
  hidden: "Oculto",
  discontinued: "Vendido",
};

const columns: DataTableColumn[] = [
  { id: "auto", header: "Auto", sortable: true },
  { id: "precio", header: "Precio", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "vigencia", header: "Vigencia", sortable: false },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminCarsPage() {
  const cars = await getCars();

  const rows: DataTableRow[] = cars.map((car) => {
    const status = statusLabel[car.status] ?? car.status;
    const vigencia =
      car.published_from || car.published_until
        ? `${car.published_from ? formatDate(car.published_from) : "…"} → ${car.published_until ? formatDate(car.published_until) : "…"}`
        : "Sin límite";
    return {
      key: car.id,
      filterText: `${car.title} ${car.make} ${car.model} ${status}`,
      sortValues: {
        auto: car.title.toLowerCase(),
        precio: car.price ?? -1,
        estado: status,
      },
      cells: {
        auto: (
          <div>
            <span className="text-foreground">{car.title}</span>
            <p className="text-xs text-foreground/40">
              {car.make} {car.model} · {car.year}
            </p>
          </div>
        ),
        precio: (
          <span className="text-foreground/60">{car.price != null ? formatCurrency(car.price, car.currency) : "Consultar"}</span>
        ),
        estado: <Badge tone={car.status === "published" ? "primary" : "default"}>{status}</Badge>,
        vigencia: <span className="text-xs text-foreground/50">{vigencia}</span>,
        acciones: (
          <Link href={`/admin/autos/${car.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
            Editar
          </Link>
        ),
      },
    };
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
            Autos Seleccionados
          </h1>
          <p className="mt-2 text-sm text-foreground/60">{cars.length} auto(s) cargados.</p>
        </div>
        <Button href="/admin/autos/nuevo">Nuevo auto</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay autos cargados." searchPlaceholder="Buscar auto..." />
        </div>
      )}
    </div>
  );
}
