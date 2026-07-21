import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GalleryForm } from "@/features/admin/GalleryForm";
import { GalleryImageForm } from "@/features/admin/GalleryImageForm";
import { GalleryImageRow } from "@/features/admin/GalleryImageRow";
import { updateGallery, addGalleryImage } from "@/actions/admin/galleries";
import type { Gallery, GalleryImage } from "@/types/database";

export const metadata: Metadata = { title: "Editar galería", robots: { index: false, follow: false } };

export default async function EditGalleryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: gallery } = await supabase
    .from("galleries")
    .select("*, images:gallery_images(*)")
    .eq("id", id)
    .single();

  if (!gallery) notFound();

  const typedGallery = gallery as Gallery;
  const images = [...(typedGallery.images ?? [])].sort((a, b) => a.position - b.position) as GalleryImage[];

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        {typedGallery.title}
      </h1>

      <div className="mt-8">
        <GalleryForm action={updateGallery.bind(null, id, typedGallery.slug)} gallery={typedGallery} />
      </div>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
          Fotos de la galería ({images.length})
        </h2>
        <p className="mt-2 text-xs text-foreground/40">
          Se muestran en la página pública de la galería, ordenadas por &quot;orden&quot;.
        </p>

        {images.length > 0 && (
          <div className="mt-4 space-y-4">
            {images.map((image) => (
              <GalleryImageRow key={image.id} image={image} galleryId={id} gallerySlug={typedGallery.slug} />
            ))}
          </div>
        )}

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">Agregar foto</p>
          <GalleryImageForm
            key={images.length}
            action={addGalleryImage.bind(null, id, typedGallery.slug)}
            submitLabel="Agregar"
          />
        </div>
      </div>
    </div>
  );
}
