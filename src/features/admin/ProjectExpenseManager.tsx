"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { addProjectExpense, deleteProjectExpense } from "@/actions/admin/projects";
import type { ProjectExpenseActionState } from "@/actions/admin/projects";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ProjectExpense } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-1 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectExpenseActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Agregar
    </Button>
  );
}

function ExpenseRow({ expense, projectId }: { expense: ProjectExpense; projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este registro?")) return;
    startTransition(async () => {
      const result = await deleteProjectExpense(expense.id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <div className="flex items-center justify-between gap-4 rounded-sm border border-secondary/30 bg-card/40 px-4 py-3 text-sm">
      <div>
        <p className="text-foreground/90">
          {expense.description}{" "}
          <span
            className={`ml-1 rounded-sm px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
              expense.kind === "extra" ? "bg-primary/20 text-primary" : "bg-secondary/20 text-foreground/60"
            }`}
          >
            {expense.kind === "extra" ? "Extra" : "Gasto"}
          </span>
        </p>
        <p className="text-xs text-foreground/40">
          {formatDate(expense.expense_date)}
          {expense.category ? ` · ${expense.category}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-4">
        <span className="font-semibold text-foreground">{formatCurrency(expense.amount, expense.currency)}</span>
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

/** Gastos operativos y extras (costos no previstos en el presupuesto inicial) del proyecto. Siempre privado. */
export function ProjectExpenseManager({ projectId, expenses }: { projectId: string; expenses: ProjectExpense[] }) {
  const [state, formAction] = useFormState(addProjectExpense.bind(null, projectId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  const sorted = [...expenses].sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1));
  const totalsByCurrency = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.currency] = (acc[e.currency] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="space-y-4">
      {Object.keys(totalsByCurrency).length > 0 && (
        <p className="text-sm text-foreground/70">
          Total gastado:{" "}
          {Object.entries(totalsByCurrency)
            .map(([currency, total]) => formatCurrency(total, currency as "ARS" | "USD"))
            .join(" + ")}
        </p>
      )}

      {sorted.map((expense) => (
        <ExpenseRow key={expense.id} expense={expense} projectId={projectId} />
      ))}
      {sorted.length === 0 && <p className="text-xs text-foreground/40">Todavía no hay gastos cargados.</p>}

      <form ref={formRef} action={formAction} className="grid gap-3 rounded-sm border border-dashed border-secondary/40 p-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>Descripción</label>
          <input name="description" type="text" required className={inputClasses} />
          {state.fieldErrors?.description?.length ? (
            <p className="mt-1 text-xs text-primary">{state.fieldErrors.description[0]}</p>
          ) : null}
        </div>
        <div>
          <label className={labelClasses}>Tipo</label>
          <select name="kind" defaultValue="gasto" className={inputClasses}>
            <option value="gasto">Gasto</option>
            <option value="extra">Extra (no previsto)</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Monto</label>
          <input name="amount" type="number" min={0} step="0.01" required className={inputClasses} />
          {state.fieldErrors?.amount?.length ? <p className="mt-1 text-xs text-primary">{state.fieldErrors.amount[0]}</p> : null}
        </div>
        <div>
          <label className={labelClasses}>Moneda</label>
          <select name="currency" defaultValue="ARS" className={inputClasses}>
            <option value="ARS">ARS</option>
            <option value="USD">USD</option>
          </select>
        </div>
        <div>
          <label className={labelClasses}>Fecha</label>
          <input name="expense_date" type="date" defaultValue={new Date().toISOString().slice(0, 10)} className={inputClasses} />
        </div>
        <div>
          <label className={labelClasses}>Categoría (opcional)</label>
          <input name="category" type="text" placeholder="Repuestos, mano de obra..." className={inputClasses} />
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
