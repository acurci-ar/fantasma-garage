import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShopCatalog } from "@/features/home/ShopCatalog";
import { getAllProducts } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Repuestos y piezas para autos clásicos, con criterio boutique.",
};

export default async function TiendaPage() {
  const products = await getAllProducts();

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Boutique, no marketplace"
        title="Tienda"
        description="Catálogo curado de repuestos y piezas. El pago con Mercado Pago se incorpora en una próxima etapa; por ahora el pedido queda pendiente de pago y te contactamos para coordinarlo."
      />
      <div className="mt-12">
        <ShopCatalog products={products} />
      </div>
    </Section>
  );
}
