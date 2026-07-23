"use client";

import { useMemo, useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface DataTableColumn {
  id: string;
  header: string;
  align?: "left" | "right";
  sortable?: boolean;
  className?: string;
}

export interface DataTableRow {
  key: string;
  /** Contenido ya renderizado por columna — se computa server-side (ver cada page.tsx de /admin), nunca funciones. */
  cells: Record<string, ReactNode>;
  /** Un valor comparable (string u number) por columna sortable. Sin entrada acá, esa columna no ordena esta fila. */
  sortValues?: Record<string, string | number>;
  /** Texto libre concatenado para el buscador (ver filtro de abajo). */
  filterText?: string;
}

type SortState = { id: string; dir: "asc" | "desc" } | null;

function SortIcon({ dir }: { dir?: "asc" | "desc" }) {
  if (!dir) {
    return <span className="text-[9px] text-foreground/25">↕</span>;
  }
  return <span className="text-[9px] text-primary">{dir === "asc" ? "▲" : "▼"}</span>;
}

/**
 * Tabla admin genérica con buscador de texto libre y columnas ordenables al
 * click. Recibe `rows` ya resueltas (celdas renderizadas + valores de orden)
 * en vez de funciones de render, porque las pages de /admin son Server
 * Components y no pueden pasar funciones a un Client Component como este —
 * solo datos serializables y JSX ya renderizado (ver notas en cada page.tsx).
 */
export function DataTable({
  columns,
  rows,
  emptyMessage = "No hay resultados.",
  searchPlaceholder = "Buscar...",
}: {
  columns: DataTableColumn[];
  rows: DataTableRow[];
  emptyMessage?: string;
  searchPlaceholder?: string;
}) {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortState>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((row) => (row.filterText ?? "").toLowerCase().includes(q));
  }, [rows, query]);

  const sorted = useMemo(() => {
    if (!sort) return filtered;
    const { id, dir } = sort;
    const withValue = filtered.filter((r) => r.sortValues?.[id] !== undefined);
    const withoutValue = filtered.filter((r) => r.sortValues?.[id] === undefined);
    withValue.sort((a, b) => {
      const va = a.sortValues![id];
      const vb = b.sortValues![id];
      const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb), "es");
      return dir === "asc" ? cmp : -cmp;
    });
    return [...withValue, ...withoutValue];
  }, [filtered, sort]);

  function handleSort(columnId: string) {
    setSort((prev) => {
      if (!prev || prev.id !== columnId) return { id: columnId, dir: "asc" };
      if (prev.dir === "asc") return { id: columnId, dir: "desc" };
      return null;
    });
  }

  return (
    <div>
      <div className="mb-4">
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={searchPlaceholder}
          className="w-full max-w-xs rounded-sm border border-secondary/50 bg-background/60 px-4 py-2 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {sorted.length === 0 ? (
        <p className="text-sm text-foreground/50">{emptyMessage}</p>
      ) : (
        <div className="overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.id}
                    className={cn("px-4 py-3 font-semibold", col.align === "right" && "text-right", col.className)}
                  >
                    {col.sortable ? (
                      <button
                        type="button"
                        onClick={() => handleSort(col.id)}
                        className="inline-flex items-center gap-1.5 uppercase tracking-wide text-foreground/50 transition-colors duration-220 hover:text-foreground"
                      >
                        {col.header}
                        <SortIcon dir={sort?.id === col.id ? sort.dir : undefined} />
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {sorted.map((row) => (
                <tr key={row.key} className="hover:bg-card/30">
                  {columns.map((col) => (
                    <td key={col.id} className={cn("px-4 py-3", col.align === "right" && "text-right", col.className)}>
                      {row.cells[col.id]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
