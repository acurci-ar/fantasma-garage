"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { updateProjectStage, toggleProjectStage, deleteProjectStage } from "@/actions/admin/projects";
import type { ProjectStageActionState } from "@/actions/admin/projects";
import type { ProjectStage } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const STATUS_LABEL: Record<ProjectStage["status"], string> = {
  pendiente: "Pendiente",
  en_curso: "En curso",
  completo: "Completo",
};

const initialState: ProjectStageActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="md" loading={pending}>
      Guardar
    </Button>
  );
}

function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function ProjectStageRow({ stage, projectId }: { stage: ProjectStage; projectId: string }) {
  const router = useRouter();
  const [state, formAction] = useFormState(updateProjectStage.bind(null, stage.id, projectId), initialState);
  const [isTogglePending, startToggle] = useTransition();
  const [isDeletePending, startDelete] = useTransition();
  const [isEditing, setIsEditing] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.status === "success") {
      router.refresh();
      setIsEditing(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  function handleToggle(next: boolean) {
    startToggle(async () => {
      const result = await toggleProjectStage(stage.id, projectId, next);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  function handleDelete() {
    if (!window.confirm(`¿Eliminar el hito "${stage.name}"?`)) return;
    startDelete(async () => {
      const result = await deleteProjectStage(stage.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className={`rounded-sm border p-4 ${stage.enabled ? "border-secondary/30 bg-card/40" : "border-secondary/10 bg-card/10 opacity-60"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-3 text-sm font-semibold uppercase tracking-wide text-foreground">
          <input
            type="checkbox"
            defaultChecked={stage.enabled}
            disabled={isTogglePending}
            onChange={(e) => handleToggle(e.target.checked)}
            className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
          />
          {stage.name}
          {!stage.template_id && (
            <span className="rounded-sm bg-secondary/20 px-2 py-0.5 text-[10px] font-normal normal-case tracking-normal text-foreground/50">
              custom
            </span>
          )}
          <span className="text-[10px] font-normal normal-case tracking-normal text-foreground/40">
            {STATUS_LABEL[stage.status]}
          </span>
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setIsEditing((v) => !v)}
            className="text-xs font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            {isEditing ? "Cancelar" : "Editar"}
          </button>
          {!stage.template_id && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeletePending}
              className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isDeletePending ? "Eliminando..." : "Eliminar"}
            </button>
          )}
        </div>
      </div>

      {isEditing && (
        <form ref={formRef} action={formAction} className="mt-4 space-y-3 border-t border-secondary/20 pt-4">
          <input type="hidden" name="enabled" defaultValue={stage.enabled ? "on" : ""} />
          <input type="hidden" name="name" defaultValue={stage.name} />

          <div className="grid gap-3 sm:grid-cols-3">
            <div>
              <label className={labelClasses}>Estado</label>
              <select name="status" defaultValue={stage.status} className={inputClasses}>
                <option value="pendiente">Pendiente</option>
                <option value="en_curso">En curso</option>
                <option value="completo">Completo</option>
              </select>
            </div>
            <div>
              <label className={labelClasses}>Inicio</label>
              <input type="date" name="started_at" defaultValue={toDateInputValue(stage.started_at)} className={inputClasses} />
            </div>
            <div>
              <label className={labelClasses}>Fin</label>
              <input type="date" name="completed_at" defaultValue={toDateInputValue(stage.completed_at)} className={inputClasses} />
            </div>
          </div>

          <div>
            <label className={labelClasses}>Notas (opcional)</label>
            <textarea name="notes" rows={2} defaultValue={stage.notes ?? ""} className={inputClasses} />
          </div>

          <div className="flex items-center gap-4">
            <SubmitButton />
            {state.status !== "idle" && (
              <p className={state.status === "success" ? "text-xs text-primary" : "text-xs text-red-400"}>{state.message}</p>
            )}
          </div>
        </form>
      )}
    </div>
  );
}
