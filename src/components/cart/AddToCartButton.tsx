"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { Button } from "@/components/ui/Button";
import type { Product } from "@/types/database";

/**
 * Botón de agregar al carrito. No soporta variantes todavía (el catálogo
 * seed actual no las usa); cuando se cargue un producto con variantes reales
 * desde /admin, esto necesitará un selector de variante antes de habilitar
 * el botón.
 */
export function AddToCartButton({
  product,
  variant = "full",
}: {
  product: Product;
  variant?: "full" | "quick";
}) {
  const { addItem, items } = useCart();
  const [quantity, setQuantity] = useState(1);

  const outOfStock = product.stock <= 0;
  const image = product.images[0]?.url ?? null;
  const price = product.sale_price ?? product.price;
  const alreadyInCart =
    items.find((i) => i.productId === product.id && i.variantId === null)?.quantity ?? 0;
  const remaining = Math.max(product.stock - alreadyInCart, 0);

  function handleAdd(qty: number) {
    addItem(
      {
        productId: product.id,
        variantId: null,
        slug: product.slug,
        name: product.name,
        image,
        unitPrice: price,
        currency: product.currency,
        stock: product.stock,
      },
      qty
    );
  }

  if (outOfStock) {
    return (
      <span className="inline-flex min-h-[44px] cursor-not-allowed items-center justify-center rounded-sm bg-primary/40 px-8 text-base font-semibold uppercase tracking-wide text-background/70">
        Sin stock
      </span>
    );
  }

  if (variant === "quick") {
    return (
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          handleAdd(1);
        }}
        disabled={remaining <= 0}
        className="inline-flex h-9 items-center justify-center rounded-sm border border-primary/50 px-3 text-xs font-semibold uppercase tracking-wide text-primary transition-colors duration-220 hover:bg-primary hover:text-background disabled:cursor-not-allowed disabled:opacity-40"
      >
        {remaining <= 0 ? "En el carrito" : "Agregar"}
      </button>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-4">
        <div className="flex items-center rounded-sm border border-secondary/40">
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-foreground/70 transition-colors duration-220 hover:text-primary"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Restar cantidad"
          >
            −
          </button>
          <span className="w-10 text-center text-sm text-foreground" aria-live="polite">
            {quantity}
          </span>
          <button
            type="button"
            className="flex h-11 w-11 items-center justify-center text-foreground/70 transition-colors duration-220 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
            onClick={() => setQuantity((q) => Math.min(q + 1, Math.max(remaining, 1)))}
            disabled={quantity >= remaining}
            aria-label="Sumar cantidad"
          >
            +
          </button>
        </div>
        <Button
          size="lg"
          disabled={remaining <= 0}
          onClick={() => {
            handleAdd(quantity);
            setQuantity(1);
          }}
          className="flex-1"
        >
          {remaining <= 0 ? "Ya está en tu carrito" : "Agregar al carrito"}
        </Button>
      </div>
      {alreadyInCart > 0 && (
        <p className="mt-2 text-xs text-foreground/40">Ya tenés {alreadyInCart} en el carrito.</p>
      )}
    </div>
  );
}
