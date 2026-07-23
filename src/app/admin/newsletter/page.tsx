import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterSubscriberStatusButton } from "@/features/admin/NewsletterSubscriberStatusButton";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
import { formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NewsletterSubscriber } from "@/types/database";

export const metadata: Metadata = { title: "Newsletter — Suscriptores", robots: { index: false, follow: false } };

async function getSubscribers(): Promise<NewsletterSubscriber[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("newsletter_subscribers")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as NewsletterSubscriber[];
}

const columns: DataTableColumn[] = [
  { id: "email", header: "Email", sortable: true },
  { id: "intereses", header: "Intereses", sortable: true },
  { id: "alta", header: "Alta", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers();

  const rows: DataTableRow[] = subscribers.map((subscriber) => {
    const interests = subscriber.interests.length > 0 ? subscriber.interests.join(", ") : "—";
    return {
      key: subscriber.id,
      filterText: `${subscriber.email} ${interests} ${subscriber.status}`,
      sortValues: {
        email: subscriber.email.toLowerCase(),
        intereses: interests.toLowerCase(),
        alta: new Date(subscriber.created_at).getTime(),
        estado: subscriber.status,
      },
      cells: {
        email: <span className="text-foreground">{subscriber.email}</span>,
        intereses: <span className="text-foreground/60">{interests}</span>,
        alta: <span className="text-foreground/60">{formatDate(subscriber.created_at)}</span>,
        estado: (
          <Badge tone={subscriber.status === "activo" ? "primary" : "default"}>
            {subscriber.status === "activo" ? "Activo" : "Baja"}
          </Badge>
        ),
        acciones: (
          <div className="flex items-center justify-end gap-4">
            <NewsletterSubscriberStatusButton id={subscriber.id} status={subscriber.status} />
            <Link href={`/admin/newsletter/${subscriber.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
              Editar
            </Link>
          </div>
        ),
      },
    };
  });

  return (
    <div>
      <NewsletterSubNav />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
            Suscriptores
          </h1>
          <p className="mt-2 text-sm text-foreground/60">{subscribers.length} suscriptor(es) cargado(s).</p>
        </div>
        <Button href="/admin/newsletter/nuevo">Agregar manualmente</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay suscriptores." searchPlaceholder="Buscar email..." />
        </div>
      )}
    </div>
  );
}
