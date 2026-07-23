"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import type { Product } from "@/types/database";

/** Catálogo de solo lectura con búsqueda en tiempo real (etapa 1). */
export function ShopCatalog({ products }: { products: Product[] }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return products;
    return products.filter(
      (p) => p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q)
    );
  }, [products, query]);

  return (
    <div>
      <div className="mb-8 max-w-sm">
        <label htmlFor="shop-search" className="sr-only">
          Buscar productos
        </label>
        <input
          id="shop-search"
          type="search"
          placeholder="Buscar productos..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-foreground/50">No encontramos productos con ese criterio.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const image = product.images[0];
            const outOfStock = product.stock <= 0;
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
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                    />
                  )}
                  {outOfStock && (
                    <span className="absolute left-3 top-3 rounded-sm bg-background/85 px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-foreground/70">
                      A pedido
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <p className="text-xs uppercase tracking-wide text-foreground/40">{product.sku}</p>
                  <h3 className="mt-1 font-display text-sm uppercase tracking-tight text-foreground">
                    {product.name}
                  </h3>
                  <div className="mt-2 flex items-center justify-between gap-2">
                    <p className="text-sm text-primary">
                      {formatCurrency(product.sale_price ?? product.price, product.currency)}
                    </p>
                    <AddToCartButton product={product} variant="quick" />
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
