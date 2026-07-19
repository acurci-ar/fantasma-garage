import type { Metadata } from "next";
import { ContactSection } from "@/features/home/ContactSection";
import { getSiteSettings } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contanos sobre tu proyecto o consultá por WhatsApp, email o en el taller.",
};

export default async function ContactoPage() {
  const settings = await getSiteSettings();
  return (
    <div className="pt-20">
      <ContactSection settings={settings} />
    </div>
  );
}
