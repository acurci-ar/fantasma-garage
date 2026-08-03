"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { reorderProjects } from "@/actions/admin/projects";
import { useDragReorder } from "@/lib/utils/useDragReorder";
import { cn } from "@/lib/utils/cn";

export interface OrderableProject {
  id: string;
  title: string;
  coverUrl: string;
  featured: boolean;
}

/**
 * Orden de aparición de los proyectos (home y /proyectos): arrastrar para
 * reordenar y confirmar con "Guardar orden". Colapsado por defecto porque
 * es una acción ocasional, no algo que el staff use en cada visita a esta
 * pantalla (la grilla de abajo, con búsqueda/orden por columna, es la vista
 * de uso diario).
 */
export function ProjectOrderManager({ projects }: { projects: OrderableProject[] }) {
  const [open, setOpen] = useState(false);
  const [ordered, setOrdered] = useState(projects);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isDirty) return;
    setOrdered(projects);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects]);

  const { draggingIndex, overIndex, dragHandleProps, dropTargetProps } = useDragReorder(ordered, (next) => {
    setOrdered(next);
    setIsDirty(true);
  });

  function handleSaveOrder() {
    startSaving(async () => {
      const result = await reorderProjects(ordered.map((project) => project.id));
      if (result.status === "error") window.alert(result.message);
      setIsDirty(false);
      router.refresh();
    });
  }

  if (projects.length === 0) return null;

  return (
    <div className="rounded-sm border border-secondary/30 bg-card/40">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left"
      >
        <span className="text-xs font-semibold uppercase tracking-wide text-foreground/70">
          Orden de aparición (home y /proyectos)
        </span>
        <span className="text-xs font-semibold uppercase tracking-wide text-primary">{open ? "Cerrar" : "Editar orden"}</span>
      </button>

      {open && (
        <div className="space-y-3 border-t border-secondary/20 p-4">
          <p className="text-xs text-foreground/40">
            Arrastrá desde el ícono de agarre. Por defecto entra primero el proyecto más reciente; acá podés
            cambiarlo a mano.
          </p>

          {isDirty && (
            <div className="flex items-center gap-4 rounded-sm border border-primary/40 bg-primary/5 px-4 py-3">
              <p className="text-xs text-foreground/70">Cambiaste el orden — no se guardó todavía.</p>
              <Button type="button" loading={isSaving} onClick={handleSaveOrder}>
                Guardar orden
              </Button>
            </div>
          )}

          <div className="space-y-2">
            {ordered.map((project, index) => (
              <div
                key={project.id}
                {...dropTargetProps(index)}
                className={cn(
                  "flex items-center gap-3 rounded-sm border border-secondary/20 bg-background/40 px-2 py-2 transition-opacity duration-220",
                  draggingIndex === index && "opacity-40",
                  overIndex === index &&
                    draggingIndex !== null &&
                    draggingIndex !== index &&
                    "outline outline-2 outline-primary/60"
                )}
              >
                <DragHandle {...dragHandleProps(index)} />
                <span className="relative h-10 w-10 shrink-0 overflow-hidden rounded-sm bg-card">
                  <Image src={project.coverUrl} alt="" fill sizes="40px" className="object-cover" />
                </span>
                <span className="min-w-0 flex-1 truncate text-sm text-foreground/80">{project.title}</span>
                {project.featured && (
                  <span className="shrink-0 rounded-sm bg-primary/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-primary">
                    Home
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
