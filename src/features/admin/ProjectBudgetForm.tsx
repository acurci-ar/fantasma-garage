"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { upsertProjectBudget } from "@/actions/admin/projects";
import type { ProjectBudgetActionState } from "@/actions/admin/projects";
import type { ProjectBudget } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectBudgetActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar presupuesto
    </Button>
  );
}

/** Presupuesto inicial cotizado (siempre privado). Un solo registro por proyecto (upsert). */
export function ProjectBudgetForm({ projectId, budget }: { projectId: string; budget: ProjectBudget | null }) {
  const [state, formAction] = useFormState(upsertProjectBudget.bind(null, projectId), initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.status === "success") router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="space-y-4 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>Monto presupuestado</label>
          <input name="amount" type="number" min={0} step="0.01" defaultValue={budget?.amount ?? ""} className={inputClasses} />
          {state.fieldErrors?.amount?.length ? <p className="mt-1 text-xs text-primary">{state.fieldErrors.amount[0]}</p> : null}
        </div>
        <div>
          <label className={labelClasses}>Moneda</label>
          <select name="currency" defaultValue={budget?.currency ?? "ARS"} className={inputClasses}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
      </div>
      <div>
        <label className={labelClasses}>Notas (opcional)</label>
        <textarea name="notes" rows={2} defaultValue={budget?.notes ?? ""} className={inputClasses} />
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status !== "idle" && (
          <p className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
