import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { formatCurrency } from "@/lib/utils/format";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import { getAllProducts, getProductBySlug } from "@/lib/content/queries";
import { ProductGallery } from "@/features/home/ProductGallery";

export async function generateStaticParams() {
  const products = await getAllProducts();
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

  const outOfStock = product.stock <= 0;
  const onSale = product.sale_price != null && product.sale_price < product.price;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    description: product.short_description,
    image: product.images.map((img) => img.url),
    category: product.category?.name,
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
        <div>
          <ProductGallery images={product.images} outOfStock={outOfStock} />
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs uppercase tracking-wide text-foreground/40">
            <span>SKU: {product.sku}</span>
            {product.category && (
              <>
                <span aria-hidden="true">·</span>
                <span>{product.category.name}</span>
              </>
            )}
          </div>
          <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-foreground sm:text-4xl">
            {product.name}
          </h1>

          {onSale ? (
            <div className="mt-4 flex flex-wrap items-baseline gap-3">
              <p className="text-lg text-foreground/40 line-through">{formatCurrency(product.price, product.currency)}</p>
              <p className="text-2xl font-semibold text-primary">
                {formatCurrency(product.sale_price as number, product.currency)}
              </p>
              <Badge tone="primary">Oferta</Badge>
            </div>
          ) : (
            <p className="mt-4 text-2xl text-primary">{formatCurrency(product.price, product.currency)}</p>
          )}

          {product.short_description && (
            <p className="mt-6 text-base leading-relaxed text-foreground/75">{product.short_description}</p>
          )}

          <div className="mt-6 flex items-center gap-3">
            <Badge tone={outOfStock ? "default" : "primary"}>
              {outOfStock ? "A pedido" : `${product.stock} disponibles`}
            </Badge>
          </div>

          <div className="mt-8">
            <AddToCartButton product={product} />
            <p className="mt-3 text-xs text-foreground/40">
              El pago con Mercado Pago se incorpora en una próxima etapa: por ahora el pedido queda
              registrado como pendiente de pago y te contactamos para coordinarlo.
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
