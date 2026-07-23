import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";
import { ContactForm, type ContactFormInitialValues } from "@/features/home/ContactForm";
import type { SiteSettings } from "@/types/database";

export function ContactSection({
  settings,
  initialValues,
}: {
  settings: SiteSettings;
  initialValues?: ContactFormInitialValues;
}) {
  const whatsappHref = `https://wa.me/${settings.whatsapp_number.replace(/[^0-9]/g, "")}`;

  return (
    <Section id="contacto">
      <SectionHeading
        eyebrow="Hablemos de tu proyecto"
        title="Contacto"
        description="Contanos sobre tu vehículo y te respondemos a la brevedad."
      />

      <div className="mt-12 grid gap-10 lg:grid-cols-[1.2fr_1fr]">
        <Panel>
          <ContactForm initialValues={initialValues} />
        </Panel>

        <div className="space-y-4">
          <Panel className="space-y-3">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground/50">
              WhatsApp
            </h3>
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg text-primary transition-colors duration-220 hover:text-foreground"
            >
              {settings.whatsapp_number}
            </a>
          </Panel>
          <Panel className="space-y-3">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground/50">Email</h3>
            <p className="text-base text-foreground/80">{settings.contact_email}</p>
          </Panel>
          <Panel className="space-y-3">
            <h3 className="font-display text-sm uppercase tracking-wide text-foreground/50">
              Ubicación y horarios
            </h3>
            <p className="text-base text-foreground/80">{settings.address}</p>
            <p className="text-sm text-foreground/60">{settings.business_hours}</p>
          </Panel>
        </div>
      </div>
    </Section>
  );
}
