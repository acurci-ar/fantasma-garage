import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { getAllCategoriesForAdmin } from "@/lib/content/queries";

export const metadata: Metadata = { title: "Categorías", robots: { index: false, follow: false } };

const statusLabel: Record<string, string> = {
  published: "Publicada",
  draft: "Borrador",
  hidden: "Oculta",
  discontinued: "Discontinuada",
};

const columns: DataTableColumn[] = [
  { id: "nombre", header: "Nombre", sortable: true },
  { id: "slug", header: "Slug", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminCategoriesPage() {
  const categories = await getAllCategoriesForAdmin();

  const rows: DataTableRow[] = categories.map((category) => ({
    key: category.id,
    filterText: `${category.name} ${category.slug}`,
    sortValues: {
      nombre: category.name.toLowerCase(),
      slug: category.slug.toLowerCase(),
      estado: statusLabel[category.status] ?? category.status,
    },
    cells: {
      nombre: <span className="text-foreground">{category.name}</span>,
      slug: <span className="text-foreground/60">{category.slug}</span>,
      estado: <Badge tone={category.status === "published" ? "primary" : "default"}>{statusLabel[category.status] ?? category.status}</Badge>,
      acciones: (
        <Link href={`/admin/categorias/${category.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
          Editar
        </Link>
      ),
    },
  }));

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Categorías</h1>
          <p className="mt-2 text-sm text-foreground/60">
            {categories.length} categoría(s). Se usan para clasificar productos y como filtro en /tienda.
          </p>
        </div>
        <Button href="/admin/categorias/nuevo">Nueva categoría</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay categorías cargadas." searchPlaceholder="Buscar categoría..." />
        </div>
      )}
    </div>
  );
}
