import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { CartPageContent } from "@/features/cart/CartPageContent";

export const metadata: Metadata = { title: "Carrito" };

export default function CarritoPage() {
  return (
    <Section className="pt-32">
      <SectionHeading eyebrow="Tu selección" title="Carrito" />
      <div className="mt-10">
        <CartPageContent />
      </div>
    </Section>
  );
}
