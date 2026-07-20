import type { Metadata } from "next";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterSubscriberForm } from "@/features/admin/NewsletterSubscriberForm";
import { createNewsletterSubscriber } from "@/actions/admin/newsletterSubscribers";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { NewsletterInterestTag } from "@/types/database";

export const metadata: Metadata = { title: "Nuevo suscriptor", robots: { index: false, follow: false } };

async function getAllInterests(): Promise<NewsletterInterestTag[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("newsletter_interests").select("*").order("sort_order", { ascending: true });
  return (data ?? []) as NewsletterInterestTag[];
}

export default async function NewNewsletterSubscriberPage() {
  const allInterests = await getAllInterests();

  return (
    <div>
      <NewsletterSubNav />
      <h1 className="mt-8 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Agregar suscriptor
      </h1>
      <p className="mt-2 text-sm text-foreground/60">
        Para altas manuales (por ejemplo, alguien que dejó su email por WhatsApp o en persona).
      </p>
      <div className="mt-8">
        <NewsletterSubscriberForm
          action={createNewsletterSubscriber}
          allInterests={allInterests}
          submitLabel="Agregar"
        />
      </div>
    </div>
  );
}
