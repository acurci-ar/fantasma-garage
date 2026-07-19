import type { Metadata } from "next";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { ShopCatalog } from "@/features/home/ShopCatalog";
import { getFeaturedProducts } from "@/lib/content/queries";

export const metadata: Metadata = {
  title: "Tienda",
  description: "Repuestos y piezas para autos clásicos, con criterio boutique.",
};

export default async function TiendaPage() {
  const products = await getFeaturedProducts();

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Boutique, no marketplace"
        title="Tienda"
        description="Catálogo curado de repuestos y piezas. El carrito y checkout con Mercado Pago se incorporan en la próxima etapa."
      />
      <div className="mt-12">
        <ShopCatalog products={products} />
      </div>
    </Section>
  );
}
