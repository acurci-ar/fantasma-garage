import { formatDate } from "@/lib/utils/format";
import type { ProjectTimeEntry } from "@/types/database";

/** Horas trabajadas en modo solo lectura, para el usuario con acceso otorgado. */
export function ProjectHoursReadOnly({ entries }: { entries: ProjectTimeEntry[] }) {
  const sorted = [...entries].sort((a, b) => (a.entry_date < b.entry_date ? 1 : -1));
  const totalHours = entries.reduce((sum, e) => sum + Number(e.hours), 0);

  if (entries.length === 0) {
    return <p className="max-w-2xl text-sm text-foreground/50">Todavía no hay horas registradas para este proyecto.</p>;
  }

  return (
    <div className="max-w-2xl space-y-4">
      <p className="text-sm text-foreground/70">Total: {totalHours}h</p>
      {sorted.map((entry) => (
        <div
          key={entry.id}
          className="flex flex-wrap items-center justify-between gap-4 rounded-sm border border-secondary/30 bg-card/40 px-4 py-3 text-sm"
        >
          <div>
            <p className="text-foreground/90">{entry.description || "Sin descripción"}</p>
            <p className="text-xs text-foreground/40">{formatDate(entry.entry_date)}</p>
          </div>
          <span className="font-semibold text-foreground">{entry.hours}h</span>
        </div>
      ))}
    </div>
  );
}
