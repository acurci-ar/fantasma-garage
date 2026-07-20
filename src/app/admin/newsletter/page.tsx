import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterSubscriberStatusButton } from "@/features/admin/NewsletterSubscriberStatusButton";
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

export default async function AdminNewsletterPage() {
  const subscribers = await getSubscribers();

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

      {isSupabaseConfigured() && subscribers.length === 0 && (
        <p className="mt-10 text-sm text-foreground/50">Todavía no hay suscriptores.</p>
      )}

      {subscribers.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Email</th>
                <th className="px-4 py-3 font-semibold">Intereses</th>
                <th className="px-4 py-3 font-semibold">Alta</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {subscribers.map((subscriber) => (
                <tr key={subscriber.id} className="hover:bg-card/30">
                  <td className="px-4 py-3 text-foreground">{subscriber.email}</td>
                  <td className="px-4 py-3 text-foreground/60">
                    {subscriber.interests.length > 0 ? subscriber.interests.join(", ") : "—"}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{formatDate(subscriber.created_at)}</td>
                  <td className="px-4 py-3">
                    <Badge tone={subscriber.status === "activo" ? "primary" : "default"}>
                      {subscriber.status === "activo" ? "Activo" : "Baja"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-4">
                      <NewsletterSubscriberStatusButton id={subscriber.id} status={subscriber.status} />
                      <Link
                        href={`/admin/newsletter/${subscriber.id}`}
                        className="text-xs font-semibold uppercase text-primary hover:underline"
                      >
                        Editar
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
