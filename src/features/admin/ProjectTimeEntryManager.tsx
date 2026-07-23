"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { addProjectTimeEntry, deleteProjectTimeEntry } from "@/actions/admin/projects";
import type { ProjectTimeEntryActionState } from "@/actions/admin/projects";
import { formatDate } from "@/lib/utils/format";
import type { ProjectTimeEntry } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectTimeEntryActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Registrar horas
    </Button>
  );
}

function TimeEntryRow({ entry, projectId }: { entry: ProjectTimeEntry; projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este registro de horas?")) return;
    startTransition(async () => {
      const result = await deleteProjectTimeEntry(entry.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-sm border border-secondary/30 bg-card/40 px-4 py-3 text-sm">
      <div>
        <p className="text-foreground/90">{entry.description || "Sin descripción"}</p>
        <p className="text-xs text-foreground/40">{formatDate(entry.entry_date)}</p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="font-semibold text-foreground">{entry.hours}h</span>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isPending ? "..." : "Eliminar"}
        </button>
      </div>
    </div>
  );
}

/** Registro de horas trabajadas en el vehículo. Siempre privado. */
export function ProjectTimeEntryManager({ projectId, entries }: { projectId: string; entries: ProjectTimeEntry[] }) {
  const [state, formAction] = useFormState(addProjectTimeEntry.bind(null, projectId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const sorted = [...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  return (
    <div className="space-y-4">
      {entries.length > 0 && <p className="text-sm text-foreground/70">Total: {totalHours}h</p>}

      {sorted.map((entry) => (
        <TimeEntryRow key={entry.id} entry={entry} projectId={projectId} />
      ))}
      {sorted.length === 0 && <p className="text-xs text-foreground/40">Todavía no hay horas registradas.</p>}

      <form ref={formRef} action={formAction} className="grid gap-3 rounded-sm border border-dashed border-secondary/40 p-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className={labelClasses}>Descripción (opcional)</label>
          <input name="description" type="text" placeholder="Desarme de motor..." className={inputClasses} />
        </div>
        <div>
          <label className={labelClasses}>Horas</label>
          <input name="hours" type="number" min={0} step="0.5" required className={inputClasses} />
          {state.fieldErrors?.hours?.length ? <p className="mt-1 text-xs text-primary">{state.fieldErrors.hours[0]}</p> : null}
        </div>
        <div>
          <label className={labelClasses}>Fecha</label>
          <input name="entry_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClasses} />
        </div>
        <div className="sm:col-span-2 flex items-center gap-4">
          <SubmitButton />
          {state.status !== "idle" && (
            <p className={state.status === "success" ? "text-xs text-primary" : "text-xs text-red-400"}>{state.message}</p>
          )}
        </div>
      </form>
    </div>
  );
}
