import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CarForm } from "@/features/admin/CarForm";
import { CarImageManager } from "@/features/admin/CarImageManager";
import { CarImageForm } from "@/features/admin/CarImageForm";
import { CarVideoManager } from "@/features/admin/CarVideoManager";
import { CarVideoForm } from "@/features/admin/CarVideoForm";
import { DeleteCarButton } from "@/features/admin/DeleteCarButton";
import { updateCar, addCarImage, addCarVideo } from "@/actions/admin/cars";
import type { Car, CarImage, CarVideo } from "@/types/database";

export const metadata: Metadata = { title: "Editar auto", robots: { index: false, follow: false } };

export default async function EditCarPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: car }, { data: videos }] = await Promise.all([
    supabase.from("cars").select("*, images:car_images(*)").eq("id", id).single(),
    supabase.from("car_videos").select("*").eq("car_id", id).order("position", { ascending: true }),
  ]);

  if (!car) notFound();

  const typedCar = car as Car;
  const images = [...(typedCar.images ?? [])].sort((a, b) => a.position - b.position) as CarImage[];
  const typedVideos = (videos ?? []) as CarVideo[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedCar.title}
        </h1>
        <DeleteCarButton id={id} />
      </div>

      <div className="mt-8">
        <CarForm action={updateCar.bind(null, id)} car={typedCar} submitLabel="Guardar cambios" />
      </div>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-lg uppercase tracking-tight text-foreground">
          Fotos ({images.length})
        </h2>
        <p className="mt-2 text-sm text-foreground/60">
          Además de la portada de la ficha. Arrastrá el ícono de agarre para reordenar.
        </p>
        <div className="mt-6">
          <CarImageManager images={images} carId={id} />
        </div>
        <div className="mt-6">
          <CarImageForm action={addCarImage.bind(null, id)} submitLabel="Agregar foto" />
        </div>
      </div>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-lg uppercase tracking-tight text-foreground">
          Videos ({typedVideos.length})
        </h2>
        <p className="mt-2 text-sm text-foreground/60">Link de YouTube o archivo/URL propia.</p>
        <div className="mt-6">
          <CarVideoManager videos={typedVideos} carId={id} />
        </div>
        <div className="mt-6">
          <CarVideoForm action={addCarVideo.bind(null, id)} submitLabel="Agregar video" />
        </div>
      </div>
    </div>
  );
}
