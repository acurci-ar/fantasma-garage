import type { Metadata } from "next";
import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { getFeaturedProjects } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Proyectos",
  description: "Restauraciones documentadas de principio a fin: historia, especificaciones y galería.",
};

const STATUS_LABEL: Record<string, string> = {
  en_curso: "En curso",
  finalizado: "Finalizado",
  en_pausa: "En pausa",
};

export default async function ProyectosPage() {
  const projects = await getFeaturedProjects();

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Trabajo terminado y en curso"
        title="Proyectos"
        description="Cada proyecto documenta el vehículo antes, durante y después de pasar por el taller."
      />
      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {projects.map((project) => (
          <Link key={project.id} href={`/proyectos/${project.slug}`} className="block">
            <EditorialCard
              image={project.cover_url}
              imageAlt={`${project.make} ${project.model} ${project.year}`}
              eyebrow={`${project.make} · ${project.year}`}
              title={project.model}
              description={project.summary}
            >
              <div className="mt-3">
                <Badge tone="primary">{STATUS_LABEL[project.status]}</Badge>
              </div>
            </EditorialCard>
          </Link>
        ))}
      </div>
      {projects.length === 0 && (
        <p className="mt-6 text-sm text-foreground/50">Todavía no hay proyectos publicados.</p>
      )}
    </Section>
  );
}
