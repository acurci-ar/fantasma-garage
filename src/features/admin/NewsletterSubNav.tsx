"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/admin/newsletter", label: "Suscriptores" },
  { href: "/admin/newsletter/intereses", label: "Intereses" },
  { href: "/admin/newsletter/enviar", label: "Enviar" },
];

export function NewsletterSubNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-wrap gap-2 border-b border-secondary/20 pb-4" aria-label="Secciones de newsletter">
      {TABS.map((tab) => {
        const active = tab.href === "/admin/newsletter" ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-sm border px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors duration-220",
              active
                ? "border-primary text-primary"
                : "border-secondary/40 text-foreground/70 hover:border-primary hover:text-primary"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
