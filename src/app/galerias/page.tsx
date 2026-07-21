import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import { getGalleries } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Galerías",
  description: "SEMA, Amigos y Trabajos: la colección visual de Fantasma Garage.",
};

export default async function GaleriasPage() {
  const galleries = await getGalleries();

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Colección visual"
        title="Galerías"
        description="Tres miradas sobre el mundo Fantasma Garage: exhibiciones, comunidad y trabajo de taller."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-3">
        {galleries.map((gallery) => (
          <Link key={gallery.id} href={`/galerias/${gallery.gallery_type}`} className="block">
            <EditorialCard
              image={gallery.cover_thumb_url ?? gallery.cover_url}
              imageAlt={gallery.title}
              title={gallery.title}
              description={gallery.description ?? undefined}
              className="aspect-square"
            />
          </Link>
        ))}
      </div>
    </Section>
  );
}
