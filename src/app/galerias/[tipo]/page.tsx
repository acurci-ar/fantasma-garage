import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { GalleryLightbox } from "@/features/home/GalleryLightbox";
import { getGalleryByType } from "@/lib/content/queries";
import { loadMoreGalleryImages } from "@/actions/gallery";

const VALID_TYPES = ["sema", "amigos", "trabajos"] as const;

export async function generateStaticParams() {
  return VALID_TYPES.map((tipo) => ({ tipo }));
}

export async function generateMetadata({
  params,
}: {
  params: { tipo: string };
}): Promise<Metadata> {
  const { tipo } = params;
  const gallery = await getGalleryByType(tipo);
  if (!gallery) return {};
  return { title: gallery.title, description: gallery.description ?? undefined };
}

export default async function GalleryDetailPage({ params }: { params: { tipo: string } }) {
  const { tipo } = params;
  if (!VALID_TYPES.includes(tipo as (typeof VALID_TYPES)[number])) notFound();

  const gallery = await getGalleryByType(tipo);
  if (!gallery) notFound();

  return (
    <Section className="pt-32">
      <SectionHeading eyebrow="Galería" title={gallery.title} description={gallery.description ?? undefined} />
      <div className="mt-12">
        <GalleryLightbox
          images={gallery.images}
          totalCount={gallery.imagesTotalCount}
          galleryId={gallery.id}
          loadMoreAction={loadMoreGalleryImages}
        />
      </div>
    </Section>
  );
}
