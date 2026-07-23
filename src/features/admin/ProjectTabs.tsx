"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "ficha", label: "Ficha" },
  { key: "multimedia", label: "Multimedia" },
  { key: "documentos", label: "Documentos" },
  { key: "seguimiento", label: "Seguimiento presupuesto" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Solapas del ABMC de proyecto: Ficha (datos + accesos), Multimedia (fotos/videos), Documentos (siempre privado) y Seguimiento presupuesto (línea de tiempo + presupuesto + gastos/extras + horas, siempre privado). */
export function ProjectTabs({
  ficha,
  multimedia,
  documentos,
  seguimiento,
}: {
  ficha: ReactNode;
  multimedia: ReactNode;
  documentos: ReactNode;
  seguimiento: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("ficha");
  const content: Record<TabKey, ReactNode> = { ficha, multimedia, documentos, seguimiento };

  return (
    <div>
      <div className="flex flex-wrap gap-2 border-b border-secondary/30">
        {TABS.map((tab) => (
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
      <div className="mt-8">{content[active]}</div>
    </div>
  );
}
