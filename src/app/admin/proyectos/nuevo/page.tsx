import type { Metadata } from "next";
import { ProjectForm } from "@/features/admin/ProjectForm";
import { createProject } from "@/actions/admin/projects";

export const metadata: Metadata = { title: "Nuevo proyecto", robots: { index: false, follow: false } };

export default function NewProjectPage() {
  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Nuevo proyecto</h1>
      <div className="mt-8">
        <ProjectForm action={createProject} submitLabel="Crear" />
      </div>
    </div>
  );
}
