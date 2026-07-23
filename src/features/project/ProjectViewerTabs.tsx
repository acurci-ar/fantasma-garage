"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Solapas de la ficha pública de un proyecto, para usuarios con acceso
 * otorgado (o staff) que ven además Documentos/Presupuesto/Horas — el
 * resto de los visitantes ve directamente el contenido de "Resumen" sin
 * solapas (ver /proyectos/[slug]/page.tsx, que solo monta este componente
 * cuando hasAccess es true).
 */
export function ProjectViewerTabs({ tabs }: { tabs: { key: string; label: string; content: ReactNode }[] }) {
  const [active, setActive] = useState(tabs[0]?.key);

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-secondary/30">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActive(tab.key)}
            className={cn(
              "rounded-t-sm px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors duration-220",
              active === tab.key
                ? "border-b-2 border-primary text-primary"
                : "text-foreground/50 hover:text-foreground/80"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="mt-10">{tabs.find((tab) => tab.key === active)?.content}</div>
    </div>
  );
}
