"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const NAV_LINKS = [
  { href: "/", label: "Inicio" },
  { href: "/servicios", label: "Servicios" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/galerias", label: "Galerías" },
  { href: "/videos", label: "Videos" },
  { href: "/tienda", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [showLogo, setShowLogo] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  // El logo del navbar solo aparece cuando el logo grande del Hero (si existe en la
  // página actual) sale de la vista al scrollear. En páginas sin Hero se muestra siempre.
  useEffect(() => {
    const heroLogo = document.getElementById("hero-logo");
    if (!heroLogo) {
      setShowLogo(true);
      return;
    }
    setShowLogo(false);
    const observer = new IntersectionObserver(
      ([entry]) => setShowLogo(!entry?.isIntersecting),
      { rootMargin: "-80px 0px 0px 0px", threshold: 0 }
    );
    observer.observe(heroLogo);
    return () => observer.disconnect();
  }, [pathname]);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-colors duration-320 ease-out motion-reduce:transition-none",
        scrolled ? "bg-background/90 backdrop-blur-md shadow-[0_1px_0_0_rgba(3,101,140,0.4)]" : "bg-transparent"
      )}
    >
      <div className="mx-auto flex h-20 w-full max-w-content items-center justify-between px-5 sm:px-8 lg:px-10">
        <Link href="/" className="flex items-center gap-3" aria-label="Fantasma Garage — Inicio">
          <span
            className={cn(
              "relative h-14 w-14 overflow-hidden rounded-full border border-secondary/60 transition-opacity duration-320 ease-out motion-reduce:transition-none",
              showLogo ? "opacity-100" : "opacity-0"
            )}
            aria-hidden={!showLogo}
          >
            <Image src="/images/logo/fantasma-logo-800.webp" alt="" fill sizes="56px" priority />
          </span>
          <span className="hidden font-display text-lg uppercase tracking-wide text-foreground sm:block">
            Fantasma Garage
          </span>
        </Link>

        <nav className="hidden items-center gap-8 lg:flex" aria-label="Navegación principal">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "text-sm font-medium uppercase tracking-wide text-foreground/80 transition-colors duration-220 hover:text-primary",
                pathname === link.href && "text-primary"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/cuenta"
            className="hidden min-h-[44px] items-center rounded-sm border border-secondary px-4 text-sm font-semibold uppercase tracking-wide text-foreground transition-colors duration-220 hover:border-primary hover:text-primary sm:inline-flex"
          >
            Mi cuenta
          </Link>
          <button
            type="button"
            className="inline-flex h-11 w-11 items-center justify-center rounded-sm border border-secondary/60 text-foreground lg:hidden"
            aria-expanded={drawerOpen}
            aria-controls="mobile-drawer"
            aria-label={drawerOpen ? "Cerrar menú" : "Abrir menú"}
            onClick={() => setDrawerOpen((v) => !v)}
          >
            <span className="sr-only">{drawerOpen ? "Cerrar menú" : "Abrir menú"}</span>
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              {drawerOpen ? (
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              ) : (
                <path d="M2 5h16M2 10h16M2 15h16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      <div
        id="mobile-drawer"
        className={cn(
          "overflow-hidden bg-background/97 backdrop-blur-md transition-[max-height] duration-320 ease-out motion-reduce:transition-none lg:hidden",
          drawerOpen ? "max-h-[28rem] border-t border-secondary/40" : "max-h-0"
        )}
      >
        <nav className="flex flex-col gap-1 px-5 py-4" aria-label="Navegación móvil">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="flex min-h-[44px] items-center text-base font-medium uppercase tracking-wide text-foreground/85 hover:text-primary"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/cuenta"
            className="mt-2 flex min-h-[44px] items-center border-t border-secondary/30 pt-3 text-base font-medium uppercase tracking-wide text-primary"
          >
            Mi cuenta
          </Link>
        </nav>
      </div>
    </header>
  );
}
