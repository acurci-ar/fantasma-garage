import Image from "next/image";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/ui/Container";
import type { SiteSettings } from "@/types/database";

export function Hero({ settings }: { settings: SiteSettings }) {
  return (
    <section className="relative flex min-h-[92vh] flex-col overflow-hidden bg-background pt-20">
      <Image
        src="/images/hero/hangar.webp"
        alt="Hangar de restauración Fantasma Garage con un auto clásico en proceso"
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-background/70 to-background/20" />
      <div className="absolute inset-0 bg-fade-radial" />

      {/* Contenido principal: ocupa el espacio disponible arriba de la franja de autoridad */}
      <div className="relative z-10 flex flex-1 items-center py-10">
        <Container>
          <div className="max-w-xl">
            <span
              id="hero-logo"
              className="relative mb-6 inline-flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border border-primary/40 shadow-glow sm:h-24 sm:w-24"
            >
              <Image
                src="/images/logo/fantasma-logo-800.webp"
                alt="Fantasma Garage"
                fill
                sizes="96px"
                priority
                className="object-cover"
              />
            </span>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-primary">
              Restauración de clásicos y muscle cars
            </p>
            <h1 className="font-display text-5xl uppercase leading-[0.95] tracking-tight text-foreground sm:text-6xl lg:text-7xl">
              Restauramos historia.
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-foreground/75 sm:text-lg">
              Restauración, personalización y preservación de autos clásicos con criterio artesanal y
              nivel de colección.
            </p>
            <div className="mt-9 flex flex-wrap gap-4">
              <Button href="/proyectos" size="lg">
                Ver proyectos
              </Button>
              <Button href="/servicios" variant="secondary" size="lg">
                Conocer el proceso
              </Button>
            </div>
          </div>
        </Container>
      </div>

      {/* Franja de autoridad: en el flujo normal, nunca se superpone al contenido de arriba */}
      <div className="relative z-10 border-t border-secondary/20 bg-background/70 backdrop-blur-sm">
        <Container className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 py-5 text-sm text-foreground/70">
          <span>
            <strong className="font-display text-primary">{settings.years_experience}+</strong> años de
            experiencia
          </span>
          <span>
            <strong className="font-display text-primary">{settings.projects_completed}+</strong> proyectos
            realizados
          </span>
          <span>Especialidad en clásicos y muscle cars de colección</span>
        </Container>
      </div>
    </section>
  );
}
