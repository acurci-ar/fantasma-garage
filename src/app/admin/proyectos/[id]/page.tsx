import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectForm } from "@/features/admin/ProjectForm";
import { DeleteProjectButton } from "@/features/admin/DeleteProjectButton";
import { ProjectTabs } from "@/features/admin/ProjectTabs";
import { ProjectAccessManager } from "@/features/admin/ProjectAccessManager";
import { ProjectImageForm } from "@/features/admin/ProjectImageForm";
import { ProjectImageRow } from "@/features/admin/ProjectImageRow";
import { ProjectVideoForm } from "@/features/admin/ProjectVideoForm";
import { ProjectVideoRow } from "@/features/admin/ProjectVideoRow";
import { BulkImageUploadForm } from "@/features/admin/BulkImageUploadForm";
import { ProjectDocumentForm } from "@/features/admin/ProjectDocumentForm";
import { ProjectDocumentRow } from "@/features/admin/ProjectDocumentRow";
import { ProjectStageManager } from "@/features/admin/ProjectStageManager";
import { ProjectBudgetForm } from "@/features/admin/ProjectBudgetForm";
import { ProjectExpenseManager } from "@/features/admin/ProjectExpenseManager";
import { ProjectTimeEntryManager } from "@/features/admin/ProjectTimeEntryManager";
import { updateProject, addProjectImage, addProjectImages, addProjectVideo } from "@/actions/admin/projects";
import { getSignedFileUrl } from "@/lib/supabase/upload";
import type {
  Project,
  ProjectImage,
  ProjectVideo,
  ProjectDocument,
  ProjectStage,
  ProjectBudget,
  ProjectExpense,
  ProjectTimeEntry,
  ProjectAccess,
} from "@/types/database";

export const metadata: Metadata = { title: "Editar proyecto", robots: { index: false, follow: false } };

export default async function EditProjectPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [
    { data: project },
    { data: videos },
    { data: stages },
    { data: documents },
    { data: budget },
    { data: expenses },
    { data: timeEntries },
    { data: access },
  ] = await Promise.all([
    supabase.from("projects").select("*, images:project_images(*)").eq("id", id).single(),
    supabase.from("project_videos").select("*").eq("project_id", id).order("position", { ascending: true }),
    supabase.from("project_stages").select("*").eq("project_id", id).order("position", { ascending: true }),
    supabase.from("project_documents").select("*").eq("project_id", id).order("created_at", { ascending: false }),
    supabase.from("project_budgets").select("*").eq("project_id", id).maybeSingle(),
    supabase.from("project_expenses").select("*").eq("project_id", id).order("expense_date", { ascending: false }),
    supabase.from("project_time_entries").select("*").eq("project_id", id).order("entry_date", { ascending: false }),
    supabase.from("project_access").select("*").eq("project_id", id).order("created_at", { ascending: true }),
  ]);

  if (!project) notFound();

  const typedProject = project as Project;
  const images = [...(typedProject.images ?? [])].sort((a, b) => a.position - b.position) as ProjectImage[];
  const typedVideos = (videos ?? []) as ProjectVideo[];
  const typedStages = (stages ?? []) as ProjectStage[];
  const typedDocuments = (documents ?? []) as ProjectDocument[];
  const typedExpenses = (expenses ?? []) as ProjectExpense[];
  const typedTimeEntries = (timeEntries ?? []) as ProjectTimeEntry[];
  const typedAccess = (access ?? []) as ProjectAccess[];

  // El bucket 'project-private' no tiene lectura pública: se genera una
  // signed URL de corta duración por documento, solo para quien ya pasó
  // project_documents_read (staff o acceso otorgado) al traer la fila.
  const documentsWithUrls = await Promise.all(
    typedDocuments.map(async (doc) => ({
      doc,
      signedUrl: await getSignedFileUrl(supabase, "project-private", doc.file_path),
    }))
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedProject.make} {typedProject.model} · {typedProject.year}
        </h1>
        <DeleteProjectButton id={id} />
      </div>

      <div className="mt-8">
        <ProjectTabs
          ficha={
            <div className="max-w-2xl space-y-8">
              <ProjectForm action={updateProject.bind(null, id)} project={typedProject} submitLabel="Guardar cambios" />
              <ProjectAccessManager projectId={id} access={typedAccess} />
            </div>
          }
          multimedia={
            <div className="max-w-2xl space-y-12">
              <section>
                <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
                  Fotos del proyecto ({images.length})
                </h2>
                <p className="mt-2 text-xs text-foreground/40">
                  Se muestran en la ficha pública del proyecto, ordenadas por &quot;orden&quot;. Marcá &quot;antes&quot;/&quot;después&quot; para
                  las fotos de comparación, y asociá cada una a un hito si corresponde.
                </p>

                {images.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {images.map((image) => (
                      <ProjectImageRow key={image.id} image={image} projectId={id} stages={typedStages} />
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <BulkImageUploadForm key={images.length} action={addProjectImages.bind(null, id)} />
                </div>

                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
                    O agregar una foto con sus datos
                  </p>
                  <ProjectImageForm
                    key={images.length}
                    action={addProjectImage.bind(null, id)}
                    stages={typedStages}
                    submitLabel="Agregar"
                  />
                </div>
              </section>

              <section>
                <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">
                  Videos del proyecto ({typedVideos.length})
                </h2>
                <p className="mt-2 text-xs text-foreground/40">Link de YouTube o archivo/URL propia.</p>

                {typedVideos.length > 0 && (
                  <div className="mt-4 space-y-4">
                    {typedVideos.map((video) => (
                      <ProjectVideoRow key={video.id} video={video} projectId={id} stages={typedStages} />
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">Agregar video</p>
                  <ProjectVideoForm
                    key={typedVideos.length}
                    action={addProjectVideo.bind(null, id)}
                    stages={typedStages}
                    submitLabel="Agregar"
                  />
                </div>
              </section>
            </div>
          }
          documentos={
            <div className="max-w-2xl space-y-6">
              <p className="text-xs text-foreground/40">
                La documentación es siempre privada: solo la ven admin/staff y los usuarios con acceso otorgado en la
                solapa Ficha, sin importar si el proyecto es público.
              </p>
              {documentsWithUrls.length > 0 && (
                <div className="space-y-3">
                  {documentsWithUrls.map(({ doc, signedUrl }) => (
                    <ProjectDocumentRow key={doc.id} doc={doc} projectId={id} signedUrl={signedUrl} />
                  ))}
                </div>
              )}
              {documentsWithUrls.length === 0 && <p className="text-xs text-foreground/40">Todavía no hay documentos.</p>}
              <ProjectDocumentForm key={documentsWithUrls.length} projectId={id} />
            </div>
          }
          seguimiento={
            <div className="max-w-2xl space-y-12">
              <p className="text-xs text-foreground/40">
                Línea de tiempo, presupuesto, gastos/extras y horas son siempre privados: solo los ven admin/staff y
                los usuarios con acceso otorgado.
              </p>

              <section>
                <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Línea de tiempo</h2>
                <div className="mt-4">
                  <ProjectStageManager projectId={id} stages={typedStages} />
                </div>
              </section>

              <section>
                <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Presupuesto inicial</h2>
                <div className="mt-4">
                  <ProjectBudgetForm projectId={id} budget={budget as ProjectBudget | null} />
                </div>
              </section>

              <section>
                <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Gastos y extras</h2>
                <div className="mt-4">
                  <ProjectExpenseManager projectId={id} expenses={typedExpenses} />
                </div>
              </section>

              <section>
                <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Horas trabajadas</h2>
                <div className="mt-4">
                  <ProjectTimeEntryManager projectId={id} entries={typedTimeEntries} />
                </div>
              </section>
            </div>
          }
        />
      </div>
    </div>
  );
}
