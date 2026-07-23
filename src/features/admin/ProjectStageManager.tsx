"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { ProjectStageRow } from "@/features/admin/ProjectStageRow";
import { addCustomProjectStage } from "@/actions/admin/projects";
import type { ProjectStageActionState } from "@/actions/admin/projects";
import type { ProjectStage } from "@/types/database";

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

/**
 * Línea de tiempo del proyecto (solapa Seguimiento). Cada proyecto arranca
 * con los 6 hitos del catálogo global (Desarme/Chapa/Motor/Pintura/
 * Interior/Entrega, ver 0012_project_tracking.sql) activados; acá se
 * desactivan los que no apliquen (ej. un proyecto solo de pintura) y se
 * pueden agregar hitos custom si no alcanza con el set fijo.
 */
export function ProjectStageManager({ projectId, stages }: { projectId: string; stages: ProjectStage[] }) {
  const sorted = [...stages].sort((a, b) => a.position - b.position);
  const [state, formAction] = useFormState(addCustomProjectStage.bind(null, projectId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-4">
      {sorted.map((stage) => (
        <ProjectStageRow key={stage.id} stage={stage} projectId={projectId} />
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
