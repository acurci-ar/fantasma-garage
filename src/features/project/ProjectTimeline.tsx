import { cn } from "@/lib/utils/cn";
import type { ProjectStage } from "@/types/database";

const STATUS_LABEL: Record<ProjectStage["status"], string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completo: "Completo",
};

/**
 * Línea de tiempo pública del proyecto (tipo Porsche Classic): solo los
 * hitos activados (`enabled`) llegan acá — ver getProjectBySlug, que ya
 * filtra los desactivados antes de pasarlos al componente. Cada hito
 * refleja su estado (pendiente/en curso/completo); fechas y notas quedan
 * en /admin, no se muestran públicamente.
 */
export function ProjectTimeline({ stages }: { stages: ProjectStage[] }) {
  if (stages.length === 0) return null;

  return (
    <ol className="grid gap-6 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none lg:gap-4">
      {stages.map((stage, index) => (
        <li
          key={stage.id}
          className={cn(
            "relative flex flex-col gap-2 border-l pl-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-5",
            stage.status === "completo" && "border-primary",
            stage.status === "en_curso" && "border-foreground/60",
            stage.status === "pendiente" && "border-secondary/40"
          )}
        >
          <span
            className={cn(
              "font-display text-sm",
              stage.status === "pendiente" ? "text-foreground/30" : "text-primary"
            )}
          >
            {String(index + 1).padStart(2, "0")}
          </span>
          <h3
            className={cn(
              "font-display text-lg uppercase tracking-tight",
              stage.status === "pendiente" ? "text-foreground/40" : "text-foreground"
            )}
          >
            {stage.name}
          </h3>
          <p className="text-xs font-semibold uppercase tracking-wide text-foreground/50">
            {STATUS_LABEL[stage.status]}
          </p>
        </li>
      ))}
    </ol>
  );
}
