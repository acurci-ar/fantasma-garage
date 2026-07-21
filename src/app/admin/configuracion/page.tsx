import type { Metadata } from "next";
import { SiteSettingsForm } from "@/features/admin/SiteSettingsForm";
import { getSiteSettings } from "@/lib/content/queries";

export const metadata: Metadata = { title: "Configuración", robots: { index: false, follow: false } };

export default async function AdminConfiguracionPage() {
  const settings = await getSiteSettings();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Configuración</h1>
      <p className="mt-2 max-w-2xl text-sm text-foreground/60">
        Datos de contacto, redes y la información estructurada que usan Google y las IAs para recomendar el
        taller.
      </p>

      <div className="mt-8 max-w-3xl">
        <SiteSettingsForm settings={settings} />
      </div>
    </div>
  );
}
