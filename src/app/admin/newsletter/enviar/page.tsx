import type { Metadata } from "next";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterExportPanel } from "@/features/admin/NewsletterExportPanel";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NewsletterInterestTag, NewsletterSubscriber } from "@/types/database";

export const metadata: Metadata = { title: "Newsletter — Enviar", robots: { index: false, follow: false } };

async function getData(): Promise<{ interests: NewsletterInterestTag[]; subscribers: NewsletterSubscriber[] }> {
  if (!isSupabaseConfigured()) return { interests: [], subscribers: [] };
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const [{ data: interests }, { data: subscribers }] = await Promise.all([
    supabase.from("newsletter_interests").select("*").order("sort_order", { ascending: true }),
    supabase.from("newsletter_subscribers").select("*"),
  ]);
  return {
    interests: (interests ?? []) as NewsletterInterestTag[],
    subscribers: (subscribers ?? []) as NewsletterSubscriber[],
  };
}

export default async function AdminNewsletterSendPage() {
  const { interests, subscribers } = await getData();

  return (
    <div>
      <NewsletterSubNav />
      <h1 className="mt-8 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Enviar novedades
      </h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        Por ahora no hay un proveedor de email conectado, así que en vez de mandar el mail desde acá, filtrá por
        interés y descargá el CSV de esos suscriptores para enviarlo manualmente desde donde ya mandes tus
        novedades.
      </p>

      {!isSupabaseConfigured() ? (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el filtro real aparece cuando esté conectado.
        </p>
      ) : (
        <div className="mt-8">
          <NewsletterExportPanel interests={interests} subscribers={subscribers} />
        </div>
      )}
    </div>
  );
}
