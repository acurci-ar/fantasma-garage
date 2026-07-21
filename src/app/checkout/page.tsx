import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckoutForm, type CheckoutFormInitialValues } from "@/features/checkout/CheckoutForm";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Profile } from "@/types/database";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

/**
 * Si hay una sesión de cliente activa, precompletamos el formulario con sus
 * datos guardados (nombre, email, teléfono, dirección de envío) para no
 * pedírselos de nuevo — quedan editables por si este pedido va a otro lado.
 */
async function getInitialValues(): Promise<CheckoutFormInitialValues | undefined> {
  if (!isSupabaseConfigured()) return undefined;

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return undefined;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const typedProfile = profile as Profile | null;

  return {
    fullName: typedProfile?.full_name ?? "",
    email: user.email ?? "",
    phone: typedProfile?.phone ?? "",
    street: typedProfile?.shipping_street ?? "",
    city: typedProfile?.shipping_city ?? "",
    province: typedProfile?.shipping_province ?? "",
    postalCode: typedProfile?.shipping_postal_code ?? "",
  };
}

export default async function CheckoutPage() {
  const initialValues = await getInitialValues();

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Un paso más"
        title="Checkout"
        description="Completá tus datos de contacto y envío. El pago se coordina en el paso siguiente."
      />
      <div className="mt-10">
        <CheckoutForm initialValues={initialValues} />
      </div>
    </Section>
  );
}
