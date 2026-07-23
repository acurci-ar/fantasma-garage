"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart/CartContext";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types/database";

/**
 * Botón de agregar al carrito. No soporta variantes todavía (el catálogo
 * seed actual no las usa); cuando se cargue un producto con variantes reales
 * desde /admin, esto necesitará un selector de variante antes de habilitar
 * el botón.
 *
 * Sin stock (stock <= 0) no bloquea la compra: se trata como "a pedido"
 * (se fabrica/consigue on demand, ver actions/checkout.ts que ya no exige
 * stock disponible para esos casos). Al agregarlo se muestra un modal
 * avisando que el producto se coordina a pedido, además del badge "A
 * pedido" que ya se ve en la ficha/catálogo.
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
  const [showOnRequestModal, setShowOnRequestModal] = useState(false);

  const isOnRequest = product.stock <= 0;
  const image = product.images[0]?.url ?? null;
  const price = product.sale_price ?? product.price;
  const alreadyInCart =
    items.find((i) => i.productId === product.id && i.variantId === null)?.quantity ?? 0;
  // "A pedido": no hay tope de depósito, siempre se puede seguir agregando.
  const remaining = isOnRequest ? Infinity : Math.max(product.stock - alreadyInCart, 0);

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
    if (isOnRequest) setShowOnRequestModal(true);
  }

  const modal = showOnRequestModal && (
    <OnRequestModal productName={product.name} onClose={() => setShowOnRequestModal(false)} />
  );

  if (variant === "quick") {
    return (
      <>
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
        {modal}
      </>
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
      {isOnRequest && (
        <p className="mt-2 text-xs text-foreground/40">
          Este producto se trabaja a pedido: no descontamos stock de depósito, te contactamos para coordinar el
          tiempo de entrega.
        </p>
      )}
      {alreadyInCart > 0 && (
        <p className="mt-2 text-xs text-foreground/40">Ya tenés {alreadyInCart} en el carrito.</p>
      )}
      {modal}
    </div>
  );
}

function OnRequestModal({ productName, onClose }: { productName: string; onClose: () => void }) {
  return (
    <>
      <div
        className="fixed inset-0 z-[70] bg-background/70 backdrop-blur-sm"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onClose();
        }}
        aria-hidden="true"
      />
      <div className="fixed inset-0 z-[71] flex items-center justify-center px-5" onClick={(e) => e.stopPropagation()}>
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Producto a pedido"
          className={cn(
            "w-full max-w-md rounded-sm border border-secondary/30 bg-background p-6 shadow-xl sm:p-8"
          )}
        >
          <div className="flex items-start justify-between gap-4">
            <h2 className="font-display text-lg uppercase tracking-wide text-foreground">Producto a pedido</h2>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-sm border border-secondary/40 text-foreground/70 transition-colors duration-220 hover:text-primary"
              aria-label="Cerrar"
            >
              <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
              </svg>
            </button>
          </div>

          <p className="mt-4 text-sm leading-relaxed text-foreground/75">
            Agregamos <span className="text-foreground">&quot;{productName}&quot;</span> a tu carrito. Ahora mismo no
            tenemos stock en depósito: este producto se trabaja a pedido, así que nos vamos a contactar para
            coordinar el tiempo de entrega antes de confirmar el pago.
          </p>

          <div className="mt-6 flex justify-end">
            <Button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
            >
              Entendido
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
