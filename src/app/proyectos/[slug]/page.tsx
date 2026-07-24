import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { ProjectTimeline } from "@/features/project/ProjectTimeline";
import { ProjectVideoGrid } from "@/features/project/ProjectVideoGrid";
import { ProjectViewerTabs } from "@/features/project/ProjectViewerTabs";
import { ProjectDocumentsReadOnly } from "@/features/project/ProjectDocumentsReadOnly";
import { ProjectBudgetReadOnly } from "@/features/project/ProjectBudgetReadOnly";
import { ProjectHoursReadOnly } from "@/features/project/ProjectHoursReadOnly";
import { getSignedFileUrl } from "@/lib/supabase/upload";
import { getFeaturedProjects, getProjectBySlug } from "@/lib/content/queries";
import type { ProjectBudget, ProjectDocument, ProjectExpense, ProjectTimeEntry } from "@/types/database";

export async function generateStaticParams() {
  const projects = await getFeaturedProjects();
  return projects.map((project) => ({ slug: project.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  const project = await getProjectBySlug(slug);
  if (!project) return {};
  return {
    title: `${project.make} ${project.model} ${project.year}`,
    description: project.summary,
    openGraph: { images: [{ url: project.cover_url }] },
  };
}

const STATUS_LABEL: Record<string, string> = {
  en_curso: "En curso",
  finalizado: "Finalizado",
  en_pausa: "En pausa",
};

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const project = await getProjectBySlug(slug);
  if (!project) notFound();

  // ¿El visitante logueado tiene acceso "de administrador" a la info privada
  // de este proyecto (documentos, presupuesto, horas)? Staff siempre; un
  // cliente común solo si figura en project_access para este proyecto en
  // particular (RLS project_access_select_own ya limita esto a sus propios
  // accesos, así que alcanza con filtrar por project_id acá).
  let hasFullAccess = false;
  let documentsWithUrls: { doc: ProjectDocument; signedUrl: string | null; thumbnailSignedUrl: string | null }[] = [];
  let budget: ProjectBudget | null = null;
  let expenses: ProjectExpense[] = [];
  let timeEntries: ProjectTimeEntry[] = [];

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).maybeSingle();
    const isStaff = profile?.role === "admin" || profile?.role === "editor";

    if (isStaff) {
      hasFullAccess = true;
    } else {
      const { data: accessRow } = await supabase
        .from("project_access")
        .select("id")
        .eq("project_id", project.id)
        .maybeSingle();
      hasFullAccess = Boolean(accessRow);
    }
  }

  if (hasFullAccess) {
    const [{ data: docs }, { data: budgetRow }, { data: expenseRows }, { data: timeRows }] = await Promise.all([
      supabase.from("project_documents").select("*").eq("project_id", project.id).order("created_at", { ascending: false }),
      supabase.from("project_budgets").select("*").eq("project_id", project.id).maybeSingle(),
      supabase.from("project_expenses").select("*").eq("project_id", project.id).order("expense_date", { ascending: false }),
      supabase.from("project_time_entries").select("*").eq("project_id", project.id).order("entry_date", { ascending: false }),
    ]);

    const typedDocuments = (docs ?? []) as ProjectDocument[];
    documentsWithUrls = await Promise.all(
      typedDocuments.map(async (doc) => ({
        doc,
        signedUrl: await getSignedFileUrl(supabase, "project-private", doc.file_path),
        thumbnailSignedUrl: doc.thumbnail_path
          ? await getSignedFileUrl(supabase, "project-private", doc.thumbnail_path)
          : null,
      }))
    );
    budget = budgetRow as ProjectBudget | null;
    expenses = (expenseRows ?? []) as ProjectExpense[];
    timeEntries = (timeRows ?? []) as ProjectTimeEntry[];
  }

  const invoicesByExpense = documentsWithUrls.filter(({ doc }) => doc.expense_id);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
      { "@type": "ListItem", position: 2, name: "Proyectos", item: "/proyectos" },
      { "@type": "ListItem", position: 3, name: project.title, item: `/proyectos/${project.slug}` },
    ],
  };

  const resumen = (
    <>
      <div className="max-w-2xl">
        <h2 className="font-display text-2xl uppercase tracking-tight text-foreground">
          La historia
        </h2>
        <p className="mt-4 text-base leading-relaxed text-foreground/75">
          {project.story ?? project.summary}
        </p>
      </div>

      {project.stages && project.stages.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Línea de tiempo</h2>
          <div className="mt-6">
            <ProjectTimeline stages={project.stages} />
          </div>
        </div>
      )}

      {project.images.length > 0 && (
        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {project.images.map((image) => (
            <div key={image.id} className="relative aspect-[4/3] overflow-hidden rounded-sm bg-card">
              <Image
                src={image.thumb_url ?? image.url}
                alt={image.alt}
                fill
                sizes="(min-width: 1024px) 33vw, 50vw"
                className="object-cover"
              />
            </div>
          ))}
        </div>
      )}

      {project.videos && project.videos.length > 0 && (
        <div className="mt-14">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Videos</h2>
          <div className="mt-6">
            <ProjectVideoGrid videos={project.videos} title={project.title} />
          </div>
        </div>
      )}
    </>
  );

  return (
    <>
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="relative flex min-h-[60vh] items-end pt-32">
        <Image
          src={project.cover_url}
          alt={project.title}
          fill
          priority
          sizes="100vw"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
        <div className="relative z-10 mx-auto w-full max-w-content px-5 pb-14 sm:px-8 lg:px-10">
          <Badge tone="primary">{STATUS_LABEL[project.status]}</Badge>
          <h1 className="mt-4 font-display text-4xl uppercase tracking-tight text-foreground sm:text-5xl">
            {project.make} {project.model}
          </h1>
          <p className="mt-2 text-lg text-foreground/70">{project.year}</p>
        </div>
      </div>

      <Section>
        {hasFullAccess ? (
          <>
            <p className="mb-8 max-w-2xl text-xs text-foreground/40">
              Tenés acceso a la información completa de este proyecto: documentos, presupuesto y horas trabajadas
              son visibles solo para vos y para el taller.
            </p>
            <ProjectViewerTabs
              tabs={[
                { key: "resumen", label: "Resumen", content: resumen },
                {
                  key: "documentos",
                  label: "Documentos",
                  content: <ProjectDocumentsReadOnly items={documentsWithUrls} />,
                },
                {
                  key: "presupuesto",
                  label: "Presupuesto",
                  content: <ProjectBudgetReadOnly budget={budget} expenses={expenses} invoices={invoicesByExpense} />,
                },
                { key: "horas", label: "Horas", content: <ProjectHoursReadOnly entries={timeEntries} /> },
              ]}
            />
          </>
        ) : (
          resumen
        )}
      </Section>
    </>
  );
}
