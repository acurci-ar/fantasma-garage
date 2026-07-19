import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

export function Badge({
  children,
  tone = "default",
  className,
}: PropsWithChildren<{ tone?: "default" | "primary"; className?: string }>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
        tone === "primary"
          ? "border-primary/50 text-primary"
          : "border-foreground/20 text-foreground/70",
        className
      )}
    >
      {children}
    </span>
  );
}
