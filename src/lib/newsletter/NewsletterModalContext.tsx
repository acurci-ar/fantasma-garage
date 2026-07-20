"use client";

import { createContext, useContext, useMemo, useState, type ReactNode } from "react";

interface NewsletterModalContextValue {
  isOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const NewsletterModalContext = createContext<NewsletterModalContextValue | null>(null);

/**
 * Estado global (un solo modal, montado una vez en el layout raíz) para que
 * el botón de la navbar, el CTA de la home y el botón del footer abran
 * exactamente el mismo formulario de suscripción, sin duplicar el modal en
 * cada lugar que lo dispara.
 */
export function NewsletterModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const value = useMemo(
    () => ({
      isOpen,
      openModal: () => setIsOpen(true),
      closeModal: () => setIsOpen(false),
    }),
    [isOpen]
  );

  return <NewsletterModalContext.Provider value={value}>{children}</NewsletterModalContext.Provider>;
}

export function useNewsletterModal(): NewsletterModalContextValue {
  const ctx = useContext(NewsletterModalContext);
  if (!ctx) {
    throw new Error("useNewsletterModal debe usarse dentro de <NewsletterModalProvider>.");
  }
  return ctx;
}
