import type { PropsWithChildren } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils/cn";

interface EditorialCardProps {
  image: string;
  imageAlt: string;
  eyebrow?: string;
  title: string;
  description?: string;
  className?: string;
  priority?: boolean;
}

/** Tarjeta editorial: imagen dominante + overlay oscuro + tipografía contenida. */
export function EditorialCard({
  image,
  imageAlt,
  eyebrow,
  title,
  description,
  className,
  priority,
  children,
}: PropsWithChildren<EditorialCardProps>) {
  return (
    <div
      className={cn(
        "group relative aspect-[4/5] overflow-hidden rounded-sm bg-card",
        className
      )}
    >
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        className="object-cover transition duration-500 ease-out motion-reduce:transition-none group-hover:scale-[1.04]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6">
        {eyebrow && (
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-primary">
            {eyebrow}
          </p>
        )}
        <h3 className="font-display text-xl uppercase tracking-tight text-foreground">{title}</h3>
        {description && <p className="mt-2 text-sm text-foreground/75">{description}</p>}
        {children}
      </div>
    </div>
  );
}

export function Panel({ children, className }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={cn("rounded-sm border border-secondary/40 bg-card/60 p-6", className)}>
      {children}
    </div>
  );
}
