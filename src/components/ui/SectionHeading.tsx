import { cn } from "@/lib/utils/cn";

interface SectionHeadingProps {
  eyebrow?: string;
  title: string;
  description?: string;
  align?: "left" | "center";
  className?: string;
}

export function SectionHeading({
  eyebrow,
  title,
  description,
  align = "left",
  className,
}: SectionHeadingProps) {
  return (
    <div className={cn("max-w-2xl", align === "center" && "mx-auto text-center", className)}>
      {eyebrow && (
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
          {eyebrow}
        </p>
      )}
      <h2 className="font-display text-3xl uppercase leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
        {title}
      </h2>
      {description && (
        <p className="mt-4 text-base leading-relaxed text-foreground/70 sm:text-lg">
          {description}
        </p>
      )}
    </div>
  );
}
