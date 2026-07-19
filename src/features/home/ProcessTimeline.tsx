import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { PROCESS_STEPS } from "@/lib/content/seed-data";

export function ProcessTimeline() {
  return (
    <Section id="proceso" className="bg-card/20">
      <SectionHeading
        eyebrow="Cómo trabajamos"
        title="Nuestro proceso"
        description="Un mismo estándar de trabajo en cada etapa, del diagnóstico a la entrega."
      />

      {/* Horizontal en desktop, vertical en móvil */}
      <ol className="mt-14 grid gap-8 sm:grid-cols-2 lg:grid-flow-col lg:auto-cols-fr lg:grid-cols-none lg:gap-6">
        {PROCESS_STEPS.map((step, index) => (
          <li key={step.key} className="relative flex flex-col gap-3 border-l border-secondary/40 pl-5 lg:border-l-0 lg:border-t lg:pl-0 lg:pt-6">
            <span className="font-display text-sm text-primary">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3 className="font-display text-lg uppercase tracking-tight text-foreground">
              {step.title}
            </h3>
            <p className="text-sm leading-relaxed text-foreground/65">{step.description}</p>
          </li>
        ))}
      </ol>
    </Section>
  );
}
