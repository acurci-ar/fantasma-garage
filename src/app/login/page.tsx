import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";
import { AuthForm } from "@/features/home/AuthForm";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage() {
  return (
    <Section className="flex min-h-[80vh] items-center pt-32">
      <div className="mx-auto w-full max-w-sm">
        <SectionHeading eyebrow="Mi cuenta" title="Iniciar sesión" align="center" />
        <Panel className="mt-8">
          <AuthForm mode="login" />
        </Panel>
      </div>
    </Section>
  );
}
