import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
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

export default async function AdminNewsletterInterestsPage() {
  const interests = await getInterests();

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

      {isSupabaseConfigured() && interests.length === 0 && (
        <p className="mt-10 text-sm text-foreground/50">Todavía no hay intereses cargados.</p>
      )}

      {interests.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Etiqueta</th>
                <th className="px-4 py-3 font-semibold">Slug</th>
                <th className="px-4 py-3 font-semibold">Orden</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {interests.map((interest) => (
                <tr key={interest.id} className="hover:bg-card/30">
                  <td className="px-4 py-3 text-foreground">{interest.label}</td>
                  <td className="px-4 py-3 text-foreground/60">{interest.slug}</td>
                  <td className="px-4 py-3 text-foreground/60">{interest.sort_order}</td>
                  <td className="px-4 py-3">
                    <Badge tone={interest.active ? "primary" : "default"}>
                      {interest.active ? "Activo" : "Inactivo"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/newsletter/intereses/${interest.id}`}
                      className="text-xs font-semibold uppercase text-primary hover:underline"
                    >
                      Editar
                    </Link>
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
