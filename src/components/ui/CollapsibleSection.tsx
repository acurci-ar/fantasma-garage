"use client";

import { useState, type ReactNode } from "react";

/**
 * Envoltorio genérico para formularios que no conviene tener siempre
 * visibles (ej. agregar foto/video en admin con todos sus campos, o
 * "Cambiar contraseña" / "Enviar un nuevo mensaje" en /cuenta): arranca
 * colapsado mostrando solo un botón, y al clickearlo revela el contenido.
 * No se auto-cierra al guardar (útil para cargar varios ítems seguidos en
 * admin); el propio botón alterna a "Cerrar" para volver a colapsarlo.
 *
 * Vivía en features/admin/CollapsibleFormSection.tsx, pero no tiene nada
 * de admin-específico — se movió acá (components/ui) al reusarla en
 * /cuenta (sección 8, ago-2026).
 */
export function CollapsibleSection({
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
