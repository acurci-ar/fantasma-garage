"use client";

import type { ReactNode } from "react";
import { useNewsletterModal } from "@/lib/newsletter/NewsletterModalContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

/**
 * Botón que abre el modal único de suscripción (NewsletterModalContext).
 * Se reutiliza en el footer y en el CTA de la home para no duplicar el
 * formulario largo en cada lugar donde queremos invitar a suscribirse.
 */
export function NewsletterCtaButton({
  children = "Suscribirme",
  size,
  className,
}: {
  children?: ReactNode;
  size?: "md" | "lg";
  className?: string;
}) {
  const { openModal } = useNewsletterModal();

  return (
    <Button type="button" size={size} onClick={openModal} className={cn(className)}>
      {children}
    </Button>
  );
}
