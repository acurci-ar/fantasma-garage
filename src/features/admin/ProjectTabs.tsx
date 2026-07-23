"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { key: "ficha", label: "Ficha" },
  { key: "multimedia", label: "Multimedia" },
  { key: "documentos", label: "Documentos" },
  { key: "timeline", label: "Línea de tiempo" },
  { key: "presupuesto", label: "Presupuesto" },
  { key: "horas", label: "Horas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

/** Solapas del ABMC de proyecto: Ficha (datos + accesos), Multimedia (fotos/videos), Documentos (siempre privado), Línea de tiempo (hitos), Presupuesto (presupuesto inicial + gastos/extras) y Horas (registro de horas) — estas últimas tres siempre privadas salvo la línea de tiempo, que sigue la visibilidad del proyecto. */
export function ProjectTabs({
  ficha,
  multimedia,
  documentos,
  timeline,
  presupuesto,
  horas,
}: {
  ficha: ReactNode;
  multimedia: ReactNode;
  documentos: ReactNode;
  timeline: ReactNode;
  presupuesto: ReactNode;
  horas: ReactNode;
}) {
  const [active, setActive] = useState<TabKey>("ficha");
  const content: Record<TabKey, ReactNode> = { ficha, multimedia, documentos, timeline, presupuesto, horas };

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
