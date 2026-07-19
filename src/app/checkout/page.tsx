import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CheckoutForm } from "@/features/checkout/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false, follow: false } };

export default function CheckoutPage() {
  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Un paso más"
        title="Checkout"
        description="Completá tus datos de contacto y envío. El pago se coordina en el paso siguiente."
      />
      <div className="mt-10">
        <CheckoutForm />
      </div>
    </Section>
  );
}
