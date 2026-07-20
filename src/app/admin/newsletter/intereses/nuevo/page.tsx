import type { Metadata } from "next";
import { NewsletterSubNav } from "@/features/admin/NewsletterSubNav";
import { NewsletterInterestForm } from "@/features/admin/NewsletterInterestForm";
import { createNewsletterInterest } from "@/actions/admin/newsletterInterests";

export const metadata: Metadata = { title: "Nuevo interés", robots: { index: false, follow: false } };

export default function NewNewsletterInterestPage() {
  return (
    <div>
      <NewsletterSubNav />
      <h1 className="mt-8 font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Nuevo interés
      </h1>
      <div className="mt-8">
        <NewsletterInterestForm action={createNewsletterInterest} submitLabel="Crear" />
      </div>
    </div>
  );
}
