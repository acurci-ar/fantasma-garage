import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";

export function Container({ children, className }: PropsWithChildren<{ className?: string }>) {
  return <div className={cn("mx-auto w-full max-w-content px-5 sm:px-8 lg:px-10", className)}>{children}</div>;
}
