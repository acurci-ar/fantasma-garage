import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { getFeaturedProjects, getProjectBySlug } from "@/lib/content/queries";

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

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Inicio", item: "/" },
      { "@type": "ListItem", position: 2, name: "Proyectos", item: "/proyectos" },
      { "@type": "ListItem", position: 3, name: project.title, item: `/proyectos/${project.slug}` },
    ],
  };

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
        <div className="max-w-2xl">
          <h2 className="font-display text-2xl uppercase tracking-tight text-foreground">
            La historia
          </h2>
          <p className="mt-4 text-base leading-relaxed text-foreground/75">
            {project.story ?? project.summary}
          </p>
        </div>

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
      </Section>
    </>
  );
}
