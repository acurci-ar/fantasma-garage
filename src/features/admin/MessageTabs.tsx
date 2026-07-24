"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface MessageTab {
  key: string;
  label: string;
  /** Mensajes sin leer (read_at null) dentro de esta solapa. */
  unreadCount: number;
  content: ReactNode;
}

/** Solapas de /admin/mensajes (Nuevos / En curso / Resueltos), cada una con un contador de no leídos. */
export function MessageTabs({ tabs }: { tabs: MessageTab[] }) {
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
              "flex items-center gap-2 rounded-t-sm px-4 py-3 text-xs font-semibold uppercase tracking-wide transition-colors duration-220",
              active === tab.key ? "border-b-2 border-primary text-primary" : "text-foreground/50 hover:text-foreground/80"
            )}
          >
            {tab.label}
            {tab.unreadCount > 0 && (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold normal-case tracking-normal text-background">
                {tab.unreadCount}
              </span>
            )}
          </button>
        ))}
      </div>
      <div className="mt-8">{tabs.find((tab) => tab.key === active)?.content}</div>
    </div>
  );
}
