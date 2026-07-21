import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/features/admin/ProjectForm";
import { DeleteProjectButton } from "@/features/admin/DeleteProjectButton";
import { ProjectImageForm } from "@/features/admin/ProjectImageForm";
import { ProjectImageRow } from "@/features/admin/ProjectImageRow";
import { BulkImageUploadForm } from "@/features/admin/BulkImageUploadForm";
import { updateProject, addProjectImage, addProjectImages } from "@/actions/admin/projects";
import type { Project, ProjectImage } from "@/types/database";

export const metadata: Metadata = { title: "Editar proyecto", robots: { index: false, follow: false } };

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: project } = await supabase
    .from("projects")
    .select("*, images:project_images(*)")
    .eq("id", id)
    .single();

  if (!project) notFound();

  const typedProject = project as Project;
  const images = [...(typedProject.images ?? [])].sort((a, b) => a.position - b.position) as ProjectImage[];

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedProject.make} {typedProject.model} · {typedProject.year}
        </h1>
        <DeleteProjectButton id={id} />
      </div>

      <div className="mt-8">
        <ProjectForm action={updateProject.bind(null, id)} project={typedProject} submitLabel="Guardar cambios" />
      </div>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
          Fotos del proyecto ({images.length})
        </h2>
        <p className="mt-2 text-xs text-foreground/40">
          Se muestran en la ficha pública del proyecto, ordenadas por &quot;orden&quot;. Marcá &quot;antes&quot;/&quot;después&quot; para las
          fotos de comparación.
        </p>

        {images.length > 0 && (
          <div className="mt-4 space-y-4">
            {images.map((image) => (
              <ProjectImageRow key={image.id} image={image} projectId={id} />
            ))}
          </div>
        )}

        <div className="mt-6">
          <BulkImageUploadForm
            key={images.length}
            action={addProjectImages.bind(null, id)}
            initialState={{ status: "idle", message: "" }}
          />
        </div>

        <div className="mt-6">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            O agregar una foto con sus datos
          </p>
          <ProjectImageForm key={images.length} action={addProjectImage.bind(null, id)} submitLabel="Agregar" />
        </div>
      </div>
    </div>
  );
}
