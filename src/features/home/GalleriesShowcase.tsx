import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import type { Gallery } from "@/types/database";

export function GalleriesShowcase({ galleries }: { galleries: Gallery[] }) {
  return (
    <Section id="galerias" className="bg-card/20">
      <SectionHeading
        eyebrow="Colección visual"
        title="Galerías"
        description="SEMA, Amigos y Trabajos: tres miradas sobre el mundo Fantasma Garage."
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
