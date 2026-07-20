"use client";

import { useNewsletterModal } from "@/lib/newsletter/NewsletterModalContext";
import { NewsletterForm } from "@/features/home/NewsletterForm";
import { cn } from "@/lib/utils/cn";

/**
 * Modal único de suscripción al newsletter, montado una vez en el layout
 * raíz y controlado por NewsletterModalContext. Se abre desde la navbar, el
 * CTA de la home o el botón del footer — siempre el mismo formulario.
 */
export function NewsletterModal() {
  const { isOpen, closeModal } = useNewsletterModal();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm transition-opacity duration-220 ease-out motion-reduce:transition-none",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeModal}
        aria-hidden="true"
      />
      <div
        className={cn(
          "fixed inset-0 z-[71] flex items-center justify-center px-5 transition-opacity duration-220 ease-out motion-reduce:transition-none",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        aria-hidden={!isOpen}
      >
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Suscribirme al newsletter"
          className={cn(
            "w-full max-w-md rounded-sm border border-secondary/30 bg-background p-6 shadow-xl transition-transform duration-220 ease-out motion-reduce:transition-none sm:p-8",
            isOpen ? "scale-100" : "scale-95"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="font-display text-lg uppercase tracking-wide text-foreground">
                Sumate a la comunidad
              </h2>
              <p className="mt-1 text-sm text-foreground/60">
                Novedades, juntadas y restauraciones terminadas, directo a tu email.
              </p>
            </div>
            <button
              type="button"
              onClick={closeModal}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-secondary/40 text-foreground/70 transition-colors duration-220 hover:text-primary"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <div className="mt-6">
            <NewsletterForm />
          </div>
        </div>
      </div>
    </>
  );
}
