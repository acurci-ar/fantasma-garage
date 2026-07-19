import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/lib/utils/format";
import { getFeaturedProducts, getProductBySlug } from "@/lib/content/queries";

export async function generateStaticParams() {
  const products = await getFeaturedProducts();
  return products.map((product) => ({ slug: product.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}): Promise<Metadata> {
  const { slug } = params;
  const product = await getProductBySlug(slug);
  if (!product) return {};
  return {
    title: product.name,
    description: product.short_description ?? undefined,
    openGraph: { images: product.images.map((img) => ({ url: img.url })) },
  };
}

export default async function ProductPage({ params }: { params: { slug: string } }) {
  const { slug } = params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const image = product.images[0];
  const outOfStock = product.stock <= 0;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.short_description,
    image: product.images.map((img) => img.url),
    offers: {
      "@type": "Offer",
      priceCurrency: product.currency,
      price: product.sale_price ?? product.price,
      availability: outOfStock
        ? "https://schema.org/OutOfStock"
        : "https://schema.org/InStock",
    },
  };

  return (
    <Section className="pt-32">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="grid gap-10 lg:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-sm bg-card">
          {image && (
            <Image src={image.url} alt={image.alt} fill sizes="(min-width: 1024px) 50vw, 100vw" className="object-cover" priority />
          )}
          {outOfStock && (
            <span className="absolute left-4 top-4 rounded-sm bg-background/85 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground/70">
              Sin stock
            </span>
          )}
        </div>

        <div>
          <p className="text-xs uppercase tracking-wide text-foreground/40">SKU: {product.sku}</p>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-4 text-2xl text-primary">
            {formatCurrency(product.sale_price ?? product.price, product.currency)}
          </p>
          {product.short_description && (
            <p className="mt-6 text-base leading-relaxed text-foreground/75">{product.short_description}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Badge tone={outOfStock ? "default" : "primary"}>
              {outOfStock ? "Sin stock" : `${product.stock} disponibles`}
            </Badge>
          </div>

          <div className="mt-8">
            {outOfStock ? (
              <span className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-sm bg-primary/40 px-8 text-base font-semibold uppercase tracking-wide text-background/70">
                Sin stock
              </span>
            ) : (
              <Button href="/contacto" size="lg">
                Consultar disponibilidad
              </Button>
            )}
            <p className="mt-3 text-xs text-foreground/40">
              El carrito y checkout con Mercado Pago se incorporan en la próxima etapa (ver README).
            </p>
          </div>

          {product.description && (
            <div className="mt-10 border-t border-secondary/30 pt-6">
              <h2 className="font-display text-sm uppercase tracking-wide text-foreground/50">
                Descripción
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-foreground/70">{product.description}</p>
            </div>
          )}
        </div>
      </div>
    </Section>
  );
}
