"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatCurrency } from "@/lib/utils/format";
import { needsUnoptimizedImage } from "@/lib/utils/image";
import { AddToCartButton } from "@/components/cart/AddToCartButton";
import { cn } from "@/lib/utils/cn";
import type { Category, Product } from "@/types/database";

/** Catálogo de solo lectura con búsqueda y filtro por categoría en tiempo real. */
export function ShopCatalog({ products, categories }: { products: Product[]; categories: Category[] }) {
  const [query, setQuery] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((p) => {
      const matchesQuery = !q || p.name.toLowerCase().includes(q) || p.short_description?.toLowerCase().includes(q);
      const matchesCategory = !categoryId || p.category_id === categoryId;
      return matchesQuery && matchesCategory;
    });
  }, [products, query, categoryId]);

  return (
    <div>
      <div className="mb-8 space-y-5">
        <div className="max-w-sm">
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

        {categories.length > 0 && (
          <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar por categoría">
            <button
              type="button"
              onClick={() => setCategoryId(null)}
              className={cn(
                "rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-220",
                categoryId === null
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-secondary/40 text-foreground/60 hover:border-primary hover:text-primary"
              )}
            >
              Todas
            </button>
            {categories.map((category) => (
              <button
                key={category.id}
                type="button"
                onClick={() => setCategoryId(category.id)}
                className={cn(
                  "rounded-sm border px-3 py-2 text-xs font-semibold uppercase tracking-wide transition-colors duration-220",
                  categoryId === category.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-secondary/40 text-foreground/60 hover:border-primary hover:text-primary"
                )}
              >
                {category.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-sm text-foreground/50">No encontramos productos con ese criterio.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((product) => {
            const image = product.images[0];
            const outOfStock = product.stock <= 0;
            const onSale = product.sale_price != null && product.sale_price < product.price;
            const imgSrc = image?.thumb_url ?? image?.url;
            return (
              <Link
                key={product.id}
                href={`/tienda/${product.slug}`}
                className="group block overflow-hidden rounded-sm border border-secondary/30 bg-card/40 transition-colors duration-220 hover:border-primary/60"
              >
                <div className="relative aspect-square overflow-hidden">
                  {imgSrc && (
                    <Image
                      src={imgSrc}
                      alt={image?.alt ?? ""}
                      fill
                      sizes="(min-width: 1024px) 33vw, 50vw"
                      className="object-cover transition duration-500 group-hover:scale-105 motion-reduce:transition-none"
                      unoptimized={needsUnoptimizedImage(imgSrc)}
                    />
                  )}
                  {onSale && (
                    <span className="absolute right-3 top-3 rounded-sm bg-primary px-2 py-1 text-[11px] font-semibold uppercase tracking-wide text-background">
                      Oferta
                    </span>
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
                    <p className="text-sm">
                      {onSale ? (
                        <span className="flex flex-wrap items-baseline gap-2">
                          <span className="text-foreground/40 line-through">{formatCurrency(product.price, product.currency)}</span>
                          <span className="font-semibold text-primary">{formatCurrency(product.sale_price as number, product.currency)}</span>
                        </span>
                      ) : (
                        <span className="text-primary">{formatCurrency(product.price, product.currency)}</span>
                      )}
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
