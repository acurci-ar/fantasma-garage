"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { DragHandle } from "@/components/ui/DragHandle";
import { ProjectStageRow } from "@/features/admin/ProjectStageRow";
import { addCustomProjectStage, reorderProjectStages } from "@/actions/admin/projects";
import type { ProjectStageActionState } from "@/actions/admin/projects";
import type { ProjectStage } from "@/types/database";
import { useDragReorder } from "@/lib/utils/useDragReorder";
import { cn } from "@/lib/utils/cn";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const initialState: ProjectStageActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Agregar hito
    </Button>
  );
}

function sortByPosition(stages: ProjectStage[]): ProjectStage[] {
  return [...stages].sort((a, b) => a.position - b.position);
}

/**
 * Línea de tiempo del proyecto (solapa Línea de tiempo). Cada proyecto
 * arranca con los hitos del catálogo global (ver
 * 0016_stage_templates_update.sql) activados; acá se desactivan los que no
 * apliquen (ej. un proyecto solo de pintura), se pueden agregar hitos
 * custom, y se puede arrastrar (ícono de agarre a la izquierda de cada
 * fila) para reordenar libremente — tanto los del catálogo como los
 * custom intercalados entre ellos.
 */
export function ProjectStageManager({ projectId, stages }: { projectId: string; stages: ProjectStage[] }) {
  const [ordered, setOrdered] = useState(() => sortByPosition(stages));
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, startSaving] = useTransition();
  const router = useRouter();

  useEffect(() => {
    if (isDirty) return; // no pisar un reordenamiento sin guardar todavía
    setOrdered(sortByPosition(stages));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stages]);

  const { draggingIndex, overIndex, dragHandleProps, dropTargetProps } = useDragReorder(ordered, (next) => {
    setOrdered(next);
    setIsDirty(true);
  });

  function handleSaveOrder() {
    startSaving(async () => {
      const result = await reorderProjectStages(
        projectId,
        ordered.map((stage) => stage.id)
      );
      if (result.status === "error") window.alert(result.message);
      setIsDirty(false);
      router.refresh();
    });
  }

  const [state, formAction] = useFormState(addCustomProjectStage.bind(null, projectId), initialState);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-4">
      {isDirty && (
        <div className="flex items-center gap-4 rounded-sm border border-primary/40 bg-primary/5 px-4 py-3">
          <p className="text-xs text-foreground/70">Cambiaste el orden — no se guardó todavía.</p>
          <Button type="button" loading={isSaving} onClick={handleSaveOrder}>
            Guardar orden
          </Button>
        </div>
      )}

      {ordered.map((stage, index) => (
        <div
          key={stage.id}
          {...dropTargetProps(index)}
          className={cn(
            "flex items-start gap-1 transition-opacity duration-220",
            draggingIndex === index && "opacity-40",
            overIndex === index && draggingIndex !== null && draggingIndex !== index && "outline outline-2 outline-primary/60"
          )}
        >
          <DragHandle {...dragHandleProps(index)} className="mt-3" />
          <div className="flex-1">
            <ProjectStageRow stage={stage} projectId={projectId} />
          </div>
        </div>
      ))}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-4 rounded-sm border border-dashed border-secondary/40 p-4">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="custom-stage-name" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Agregar hito custom (ej. &quot;Tapizado&quot;, &quot;Electrónica&quot;)
          </label>
          <input id="custom-stage-name" name="name" type="text" required className={inputClasses} />
          {state.fieldErrors?.name?.length ? <p className="mt-1 text-xs text-primary">{state.fieldErrors.name[0]}</p> : null}
        </div>
        <SubmitButton />
      </form>
      {state.status !== "idle" && !state.fieldErrors && (
        <p className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>{state.message}</p>
      )}
    </div>
  );
}
