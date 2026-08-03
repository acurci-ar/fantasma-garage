import { cn } from "@/lib/utils/cn";

/** Ícono de "agarre" para las listas arrastrables (useDragReorder). Puramente visual — los props de drag van por afuera (spread) en el elemento que lo usa. */
export function DragHandle({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      {...props}
      className={cn(
        "flex h-8 w-6 shrink-0 cursor-grab touch-none items-center justify-center text-foreground/30 transition-colors duration-220 hover:text-foreground/60 active:cursor-grabbing",
        className
      )}
      aria-label="Arrastrar para reordenar"
      role="button"
    >
      <svg width="10" height="16" viewBox="0 0 10 16" fill="currentColor" aria-hidden="true">
        <circle cx="2" cy="2" r="1.4" />
        <circle cx="8" cy="2" r="1.4" />
        <circle cx="2" cy="8" r="1.4" />
        <circle cx="8" cy="8" r="1.4" />
        <circle cx="2" cy="14" r="1.4" />
        <circle cx="8" cy="14" r="1.4" />
      </svg>
    </span>
  );
}
