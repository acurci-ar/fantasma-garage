import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
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

const columns: DataTableColumn[] = [
  { id: "vehiculo", header: "Vehículo", sortable: true },
  { id: "etapa", header: "Etapa", sortable: true },
  { id: "visibilidad", header: "Visibilidad", sortable: true },
  { id: "publicado", header: "Publicado", sortable: true },
  { id: "fotos", header: "Fotos", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminProjectsPage() {
  const projects = await getProjects();

  const rows: DataTableRow[] = projects.map((project) => {
    const status = statusLabel[project.status] ?? project.status;
    const vehicle = `${project.make} ${project.model} · ${project.year}`;
    return {
      key: project.id,
      filterText: `${vehicle} ${status} ${project.visibility}`,
      sortValues: {
        vehiculo: `${project.make} ${project.model}`.toLowerCase(),
        etapa: status,
        visibilidad: project.visibility,
        publicado: project.featured ? 1 : 0,
        fotos: project.images?.length ?? 0,
      },
      cells: {
        vehiculo: <span className="text-foreground">{vehicle}</span>,
        etapa: <span className="text-foreground/60">{status}</span>,
        visibilidad: (
          <Badge tone={project.visibility === "private" ? "default" : "primary"}>
            {project.visibility === "private" ? "Privado" : "Público"}
          </Badge>
        ),
        publicado: <Badge tone={project.featured ? "primary" : "default"}>{project.featured ? "Sí" : "No"}</Badge>,
        fotos: <span className="text-foreground/60">{project.images?.length ?? 0}</span>,
        acciones: (
          <Link href={`/admin/proyectos/${project.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
            Editar
          </Link>
        ),
      },
    };
  });

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

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay proyectos cargados." searchPlaceholder="Buscar vehículo..." />
        </div>
      )}
    </div>
  );
}
