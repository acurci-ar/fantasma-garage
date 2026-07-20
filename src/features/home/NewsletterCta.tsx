import { Section } from "@/components/ui/Section";
import { NewsletterCtaButton } from "@/features/home/NewsletterCtaButton";

/**
 * CTA de suscripción al newsletter en la home. En vez de un formulario
 * largo embebido acá (que solo ve quien scrollea hasta esta sección), el
 * botón abre el mismo modal accesible también desde la navbar y el footer.
 */
export function NewsletterCta() {
  return (
    <Section className="border-y border-secondary/20 bg-card/20">
      <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-primary">Comunidad Fantasma Garage</p>
        <h2 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          Sumate a nuestras novedades
        </h2>
        <p className="max-w-lg text-base text-foreground/70">
          Restauraciones terminadas, juntadas, eventos y lanzamientos de la tienda — elegís qué te interesa y te
          avisamos por email antes que a nadie.
        </p>
        <NewsletterCtaButton size="lg">Quiero recibir novedades</NewsletterCtaButton>
      </div>
    </Section>
  );
}
