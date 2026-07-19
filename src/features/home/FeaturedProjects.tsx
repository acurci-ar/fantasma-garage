import Link from "next/link";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { EditorialCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import type { Project } from "@/types/database";

const STATUS_LABEL: Record<Project["status"], string> = {
  en_curso: "En curso",
  finalizado: "Finalizado",
  en_pausa: "En pausa",
};

export function FeaturedProjects({ projects }: { projects: Project[] }) {
  return (
    <Section id="proyectos">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Historias con final"
          title="Proyectos destacados"
          description="Una selección de restauraciones documentadas de principio a fin."
        />
        <Button href="/proyectos" variant="ghost">
          Ver todos →
        </Button>
      </div>

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

      <p className="mt-6 text-xs text-foreground/40">
        Los proyectos mostrados son datos de demostración hasta cargar contenido real desde /admin.
      </p>
    </Section>
  );
}
