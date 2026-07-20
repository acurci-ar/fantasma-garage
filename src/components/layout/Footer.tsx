import Image from "next/image";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { NewsletterCtaButton } from "@/features/home/NewsletterCtaButton";
import type { SiteSettings } from "@/types/database";

const SECONDARY_LINKS = [
  { href: "/servicios", label: "Servicios" },
  { href: "/proyectos", label: "Proyectos" },
  { href: "/galerias", label: "Galerías" },
  { href: "/videos", label: "Videos" },
  { href: "/tienda", label: "Tienda" },
  { href: "/contacto", label: "Contacto" },
];

export function Footer({ settings }: { settings: SiteSettings }) {
  return (
    <footer className="border-t border-secondary/30 bg-background">
      <div className="border-b border-secondary/20 bg-card/20">
        <Container className="flex flex-wrap items-center justify-between gap-6 py-10">
          <div>
            <h3 className="font-display text-lg uppercase tracking-wide text-foreground">
              Recibí novedades
            </h3>
            <p className="mt-2 max-w-sm text-sm text-foreground/60">
              Enterate de restauraciones terminadas, juntadas y eventos antes que nadie.
            </p>
          </div>
          <NewsletterCtaButton>Quiero recibir novedades</NewsletterCtaButton>
        </Container>
      </div>

      <Container className="grid gap-10 py-14 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-3" aria-label="Fantasma Garage — Inicio">
            <span className="relative h-10 w-10 overflow-hidden rounded-full border border-secondary/60">
              <Image src="/images/logo/fantasma-logo-800.webp" alt="Fantasma Garage" fill sizes="40px" />
            </span>
            <span className="font-display text-base uppercase tracking-wide text-foreground">
              Fantasma Garage
            </span>
          </Link>
          <p className="mt-4 max-w-xs text-sm text-foreground/60">
            Atelier de restauración de autos clásicos y muscle cars de colección.
          </p>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Navegación
          </h3>
          <ul className="space-y-2">
            {SECONDARY_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  className="text-sm text-foreground/70 transition-colors duration-220 hover:text-primary"
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Contacto
          </h3>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li>{settings.contact_email}</li>
            <li>{settings.address}</li>
            <li>{settings.business_hours}</li>
          </ul>
        </div>

        <div>
          <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-foreground/50">
            Seguinos
          </h3>
          <ul className="space-y-2">
            <li>
              <a
                href={settings.instagram_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/70 transition-colors duration-220 hover:text-primary"
              >
                Instagram
              </a>
            </li>
            <li>
              <a
                href={settings.youtube_channel_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-foreground/70 transition-colors duration-220 hover:text-primary"
              >
                YouTube
              </a>
            </li>
          </ul>
        </div>
      </Container>

      <div className="border-t border-secondary/20 py-6">
        <Container className="flex flex-col items-center justify-between gap-3 text-xs text-foreground/45 sm:flex-row">
          <p>© {new Date().getFullYear()} Fantasma Garage. Todos los derechos reservados.</p>
          <p>Datos legales a completar (CUIT, domicilio fiscal) desde configuración del sitio.</p>
        </Container>
      </div>
    </footer>
  );
}
