import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterSubscriberForm } from "@/features/admin/NewsletterSubscriberForm";
import { DeleteNewsletterSubscriberButton } from "@/features/admin/DeleteNewsletterSubscriberButton";
import { updateNewsletterSubscriber } from "@/actions/admin/newsletterSubscribers";
import type { NewsletterInterestTag, NewsletterSubscriber } from "@/types/database";

export const metadata: Metadata = { title: "Editar suscriptor", robots: { index: false, follow: false } };

export default async function EditNewsletterSubscriberPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: subscriber }, { data: interests }] = await Promise.all([
    supabase.from("newsletter_subscribers").select("*").eq("id", id).single(),
    supabase.from("newsletter_interests").select("*").order("sort_order", { ascending: true }),
  ]);

  if (!subscriber) notFound();

  const typedSubscriber = subscriber as NewsletterSubscriber;
  const allInterests = (interests ?? []) as NewsletterInterestTag[];

  return (
    <div>
      <NewsletterSubNav />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedSubscriber.email}
        </h1>
        <DeleteNewsletterSubscriberButton id={id} />
      </div>
      <div className="mt-8">
        <NewsletterSubscriberForm
          action={updateNewsletterSubscriber.bind(null, id)}
          allInterests={allInterests}
          subscriber={typedSubscriber}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
