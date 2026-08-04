import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";
import { RequestPasswordResetForm } from "@/features/account/RequestPasswordResetForm";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function RecuperarPage() {
  return (
    <Section className="flex min-h-[80vh] items-center pt-32">
      <div className="mx-auto w-full max-w-sm">
        <SectionHeading eyebrow="Mi cuenta" title="Recuperar contraseña" align="center" />
        <Panel className="mt-8">
          <RequestPasswordResetForm />
        </Panel>
      </div>
    </Section>
  );
}
