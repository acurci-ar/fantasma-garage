import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterInterestForm } from "@/features/admin/NewsletterInterestForm";
import { DeleteNewsletterInterestButton } from "@/features/admin/DeleteNewsletterInterestButton";
import { updateNewsletterInterest } from "@/actions/admin/newsletterInterests";
import type { NewsletterInterestTag } from "@/types/database";

export const metadata: Metadata = { title: "Editar interés", robots: { index: false, follow: false } };

export default async function EditNewsletterInterestPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: interest } = await supabase.from("newsletter_interests").select("*").eq("id", id).single();

  if (!interest) notFound();

  const typedInterest = interest as NewsletterInterestTag;

  return (
    <div>
      <NewsletterSubNav />
      <div className="mt-8 flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedInterest.label}
        </h1>
        <DeleteNewsletterInterestButton id={id} />
      </div>
      <div className="mt-8">
        <NewsletterInterestForm
          action={updateNewsletterInterest.bind(null, id)}
          interest={typedInterest}
          submitLabel="Guardar cambios"
        />
      </div>
    </div>
  );
}
