import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Panel } from "@/components/ui/Card";
import { SetNewPasswordForm } from "@/features/account/SetNewPasswordForm";

export const metadata: Metadata = { title: "Nueva contraseña" };

/**
 * Destino tras tocar el link de recuperación (ver requestPasswordReset en
 * actions/account.ts): cae bajo el matcher /cuenta/:path* del middleware,
 * así que si de alguna forma se llega acá sin la sesión de recuperación
 * activa, ya redirige solo a /login antes de renderizar nada de esto.
 */
export default function NuevaContrasenaPage() {
  return (
    <Section className="flex min-h-[80vh] items-center pt-32">
      <div className="mx-auto w-full max-w-sm">
        <SectionHeading eyebrow="Mi cuenta" title="Nueva contraseña" align="center" />
        <Panel className="mt-8">
          <SetNewPasswordForm />
        </Panel>
      </div>
    </Section>
  );
}
