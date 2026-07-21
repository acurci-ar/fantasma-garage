import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Project } from "@/types/database";

export const metadata: Metadata = { title: "Proyectos", robots: { index: false, follow: false } };

const statusLabel: Record<string, string> = {
  en_curso: "En curso",
  finalizado: "Finalizado",
  en_pausa: "En pausa",
};

async function getProjects(): Promise<Project[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("projects")
    .select("*, images:project_images(*)")
    .order("year", { ascending: false });
  return (data ?? []) as Project[];
}

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Proyectos</h1>
          <p className="mt-2 text-sm text-foreground/60">{projects.length} proyecto(s) cargado(s).</p>
        </div>
        <Button href="/admin/proyectos/nuevo">Nuevo proyecto</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté conectado.
        </p>
      )}

      {isSupabaseConfigured() && projects.length === 0 && (
        <p className="mt-10 text-sm text-foreground/50">Todavía no hay proyectos cargados.</p>
      )}

      {projects.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Vehículo</th>
                <th className="px-4 py-3 font-semibold">Etapa</th>
                <th className="px-4 py-3 font-semibold">Publicado</th>
                <th className="px-4 py-3 font-semibold">Fotos</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {projects.map((project) => (
                <tr key={project.id} className="hover:bg-card/30">
                  <td className="px-4 py-3 text-foreground">
                    {project.make} {project.model} · {project.year}
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{statusLabel[project.status] ?? project.status}</td>
                  <td className="px-4 py-3">
                    <Badge tone={project.featured ? "primary" : "default"}>
                      {project.featured ? "Sí" : "No"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-foreground/60">{project.images?.length ?? 0}</td>
                  <td className="px-4 py-3 text-right">
                    <Link
                      href={`/admin/proyectos/${project.id}`}
                      className="text-xs font-semibold uppercase text-primary hover:underline"
                    >
                      Editar
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
