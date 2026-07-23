import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NewsletterInterestTag } from "@/types/database";

export const metadata: Metadata = { title: "Newsletter — Intereses", robots: { index: false, follow: false } };

async function getInterests(): Promise<NewsletterInterestTag[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("newsletter_interests").select("*").order("sort_order", { ascending: true });
  return (data ?? []) as NewsletterInterestTag[];
}

const columns: DataTableColumn[] = [
  { id: "etiqueta", header: "Etiqueta", sortable: true },
  { id: "slug", header: "Slug", sortable: true },
  { id: "orden", header: "Orden", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminNewsletterInterestsPage() {
  const interests = await getInterests();

  const rows: DataTableRow[] = interests.map((interest) => ({
    key: interest.id,
    filterText: `${interest.label} ${interest.slug}`,
    sortValues: {
      etiqueta: interest.label.toLowerCase(),
      slug: interest.slug.toLowerCase(),
      orden: interest.sort_order,
      estado: interest.active ? 1 : 0,
    },
    cells: {
      etiqueta: <span className="text-foreground">{interest.label}</span>,
      slug: <span className="text-foreground/60">{interest.slug}</span>,
      orden: <span className="text-foreground/60">{interest.sort_order}</span>,
      estado: <Badge tone={interest.active ? "primary" : "default"}>{interest.active ? "Activo" : "Inactivo"}</Badge>,
      acciones: (
        <Link href={`/admin/newsletter/intereses/${interest.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
          Editar
        </Link>
      ),
    },
  }));

  return (
    <div>
      <NewsletterSubNav />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
            Lista de intereses
          </h1>
          <p className="mt-2 text-sm text-foreground/60">
            {interests.length} tag(s). Son las opciones que ve quien se suscribe en la web (marcas, modelos,
            juntadas, eventos, etc.).
          </p>
        </div>
        <Button href="/admin/newsletter/intereses/nuevo">Nuevo interés</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay intereses cargados." searchPlaceholder="Buscar interés..." />
        </div>
      )}
    </div>
  );
}
