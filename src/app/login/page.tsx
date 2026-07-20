import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";
import { AuthForm } from "@/features/home/AuthForm";
import { sanitizeRedirect } from "@/lib/utils/redirect";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default function LoginPage({ searchParams }: { searchParams: { redirect?: string } }) {
  const redirectTo = sanitizeRedirect(searchParams.redirect);

  return (
    <Section className="flex min-h-[80vh] items-center pt-32">
      <div className="mx-auto w-full max-w-sm">
        <SectionHeading eyebrow="Mi cuenta" title="Iniciar sesión" align="center" />
        <Panel className="mt-8">
          <AuthForm mode="login" redirectTo={redirectTo} />
        </Panel>
      </div>
    </Section>
  );
}
