import type { PropsWithChildren } from "react";
import { cn } from "@/lib/utils/cn";
import { Container } from "@/components/ui/Container";

interface SectionProps {
  id?: string;
  className?: string;
  containerClassName?: string;
  as?: "section" | "div";
}

export function Section({
  id,
  className,
  containerClassName,
  as = "section",
  children,
}: PropsWithChildren<SectionProps>) {
  const Tag = as;
  return (
    <Tag id={id} className={cn("py-16 sm:py-20 lg:py-28", className)}>
      <Container className={containerClassName}>{children}</Container>
    </Tag>
  );
}
