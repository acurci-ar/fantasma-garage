import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { ProjectBudget, ProjectExpense } from "@/types/database";

/** Presupuesto inicial + gastos/extras en modo solo lectura, para el usuario con acceso otorgado. */
export function ProjectBudgetReadOnly({
  budget,
  expenses,
}: {
  budget: ProjectBudget | null;
  expenses: ProjectExpense[];
}) {
  const sorted = [...expenses].sort((a, b) => (a.expense_date < b.expense_date ? 1 : -1));
  const totalsByCurrency = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.currency] = (acc[e.currency] ?? 0) + e.amount;
    return acc;
  }, {});

  return (
    <div className="max-w-2xl space-y-10">
      <div>
        <h3 className="font-display text-sm uppercase tracking-wide text-foreground/70">Presupuesto inicial</h3>
        {budget?.amount != null ? (
          <p className="mt-2 text-2xl text-primary">{formatCurrency(budget.amount, budget.currency)}</p>
        ) : (
          <p className="mt-2 text-sm text-foreground/50">Todavía no se cargó un presupuesto inicial.</p>
        )}
        {budget?.notes && <p className="mt-2 text-sm text-foreground/60">{budget.notes}</p>}
      </div>

      <div>
        <h3 className="font-display text-sm uppercase tracking-wide text-foreground/70">Gastos y extras</h3>
        {Object.keys(totalsByCurrency).length > 0 && (
          <p className="mt-2 text-sm text-foreground/70">
            Total:{" "}
            {Object.entries(totalsByCurrency)
              .map(([currency, total]) => formatCurrency(total, currency as "ARS" | "USD"))
              .join(" + ")}
          </p>
        )}
        {sorted.length === 0 ? (
          <p className="mt-4 text-sm text-foreground/50">Todavía no hay gastos cargados.</p>
        ) : (
          <div className="mt-4 space-y-3">
            {sorted.map((expense) => (
              <div
                key={expense.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-secondary/30 bg-card/40 px-4 py-3 text-sm"
              >
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
                <span className="font-semibold text-foreground">{formatCurrency(expense.amount, expense.currency)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <Badge tone="default">Solo vos ves esta información</Badge>
    </div>
  );
}
