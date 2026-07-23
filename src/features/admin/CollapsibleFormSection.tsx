"use client";

import { useState, type ReactNode } from "react";

/**
 * Envoltorio genérico para formularios grandes que no conviene tener
 * siempre visibles (ej. agregar foto/video con todos sus campos): arranca
 * colapsado mostrando solo un botón, y al clickearlo revela el contenido.
 * No se auto-cierra al guardar (útil para cargar varios ítems seguidos);
 * el propio botón alterna a "Cerrar" para volver a colapsarlo.
 */
export function CollapsibleFormSection({
  addLabel,
  closeLabel = "Cerrar",
  defaultOpen = false,
  children,
}: {
  addLabel: string;
  closeLabel?: string;
  defaultOpen?: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-sm border border-secondary/50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-foreground/80 transition-colors duration-220 hover:border-primary hover:text-primary"
      >
        {open ? closeLabel : addLabel}
      </button>
      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}
