import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Gallery } from "@/types/database";

export const metadata: Metadata = { title: "Galerías", robots: { index: false, follow: false } };

async function getGalleries(): Promise<Gallery[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("galleries")
    .select("*, images:gallery_images(*)")
    .order("gallery_type", { ascending: true });
  return (data ?? []) as Gallery[];
}

const columns: DataTableColumn[] = [
  { id: "galeria", header: "Galería", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "fotos", header: "Fotos", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminGalleriesPage() {
  const galleries = await getGalleries();

  const rows: DataTableRow[] = galleries.map((gallery) => ({
    key: gallery.id,
    filterText: `${gallery.title} ${gallery.status}`,
    sortValues: {
      galeria: gallery.title.toLowerCase(),
      estado: gallery.status,
      fotos: gallery.images?.length ?? 0,
    },
    cells: {
      galeria: <span className="text-foreground">{gallery.title}</span>,
      estado: <Badge tone={gallery.status === "published" ? "primary" : "default"}>{gallery.status}</Badge>,
      fotos: <span className="text-foreground/60">{gallery.images?.length ?? 0}</span>,
      acciones: (
        <Link href={`/admin/galerias/${gallery.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
          Editar
        </Link>
      ),
    },
  }));

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Galerías</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        SEMA, Amigos y Trabajos son fijas (no se crean ni se borran galerías nuevas): acá se edita el título,
        descripción, portada, estado y las fotos de cada una.
      </p>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay galerías." searchPlaceholder="Buscar galería..." />
        </div>
      )}
    </div>
  );
}
