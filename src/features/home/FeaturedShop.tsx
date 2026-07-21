import Link from "next/link";
import Image from "next/image";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import type { Product } from "@/types/database";

export function FeaturedShop({ products }: { products: Product[] }) {
  return (
    <Section id="tienda" className="bg-card/20">
      <div className="flex flex-wrap items-end justify-between gap-6">
        <SectionHeading
          eyebrow="Boutique, no marketplace"
          title="Tienda destacada"
          description="Una selección curada de repuestos y piezas para tu clásico."
        />
        <Button href="/tienda" variant="ghost">
          Ver tienda →
        </Button>
      </div>

      <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {products.map((product) => {
          const image = product.images[0];
          return (
            <Link
              key={product.id}
              href={`/tienda/${product.slug}`}
              className="group block overflow-hidden rounded-sm border border-secondary/30 bg-card/40 transition-colors duration-220 hover:border-primary/60"
            >
              <div className="relative aspect-square overflow-hidden">
                {image && (
                  <Image
                    src={image.thumb_url ?? image.url}
                    alt={image.alt}
                    fill
                    sizes="(min-width: 1024px) 25vw, 50vw"
                    className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                  />
                )}
                {product.stock <= 0 && (
                  <span className="absolute left-3 top-3 rounded-sm bg-background/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                    Sin stock
                  </span>
                )}
              </div>
              <div className="p-4">
                <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
                  {product.name}
                </h3>
                <p className="mt-1 text-sm text-primary">
                  {formatCurrency(product.sale_price ?? product.price, product.currency)}
                </p>
              </div>
            </Link>
          );
        })}
      </div>

      <p className="mt-6 text-xs text-foreground/40">
        El pago con Mercado Pago todavía no está integrado: el pedido queda pendiente de pago y te
        contactamos para coordinarlo.
      </p>
    </Section>
  );
}
