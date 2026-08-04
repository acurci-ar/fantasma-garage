import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

/**
 * Label de campo de formulario con ayuda contextual: al posar el mouse más
 * de 2 segundos aparece un globo con qué es el campo y un ejemplo (pedido
 * general "a todos los formularios" del smoke test). El delay se logra con
 * CSS puro (transition-delay solo en la variante :hover, no en la base), sin
 * JS ni estado — así no hay que instrumentar un timer por campo.
 *
 * Drop-in reemplazo de `<label className={labelClasses}>Texto</label>`:
 * mismo className de siempre, mismo `htmlFor`, con `help`/`example`
 * opcionales. Si no se pasa `help`, se comporta como un label normal (sin
 * globo ni cursor de ayuda).
 */
export function FieldLabel({
  htmlFor,
  children,
  help,
  example,
  className,
}: {
  htmlFor?: string;
  children: ReactNode;
  /** Para qué sirve el campo, en una oración. */
  help?: string;
  /** Ejemplo concreto de un valor válido. */
  example?: string;
  className?: string;
}) {
  if (!help) {
    return (
      <label htmlFor={htmlFor} className={className}>
        {children}
      </label>
    );
  }

  return (
    <label htmlFor={htmlFor} className={cn("group/field relative inline-flex cursor-help items-center gap-1", className)}>
      {children}
      <span
        className="pointer-events-none absolute left-0 top-full z-30 mt-2 w-64 max-w-[80vw] rounded-sm border border-secondary/40 bg-background text-left text-xs font-normal normal-case leading-relaxed tracking-normal text-foreground/80 opacity-0 shadow-lg transition-opacity duration-150 group-hover/field:opacity-100 group-hover/field:delay-[2000ms]"
        role="tooltip"
      >
        <span className="block p-3">
          {help}
          {example && (
            <span className="mt-1.5 block text-foreground/50">
              Ejemplo: <span className="text-foreground/65">{example}</span>
            </span>
          )}
        </span>
      </span>
    </label>
  );
}
