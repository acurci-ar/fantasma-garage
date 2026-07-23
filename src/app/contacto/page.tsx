import type { Metadata } from "next";
import { ContactSection } from "@/features/home/ContactSection";
import { getSiteSettings } from "@/lib/content/queries";
import { getLoggedInProfile } from "@/lib/account/getLoggedInProfile";

export const metadata: Metadata = {
  title: "Contacto",
  description: "Contanos sobre tu proyecto o consultá por WhatsApp, email o en el taller.",
};

export default async function ContactoPage() {
  const [settings, loggedIn] = await Promise.all([getSiteSettings(), getLoggedInProfile()]);
  const initialValues = loggedIn
    ? { name: loggedIn.profile?.full_name ?? "", email: loggedIn.email, phone: loggedIn.profile?.phone ?? "" }
    : undefined;

  return (
    <div className="pt-20">
      <ContactSection settings={settings} initialValues={initialValues} />
    </div>
  );
}
