"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, maxQuantityForStock } from "@/lib/cart/CartContext";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";

export function CartPageContent() {
  const { items, updateQuantity, removeItem, subtotal, currency } = useCart();

  if (items.length === 0) {
    return (
      <div className="rounded-sm border border-secondary/30 bg-card/40 p-10 text-center">
        <p className="text-sm text-foreground/60">Todavía no agregaste productos a tu carrito.</p>
        <div className="mt-6">
          <Button href="/tienda">Ir a la tienda</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
      <ul className="space-y-6">
        {items.map((item) => {
          const lineKey = `${item.productId}-${item.variantId ?? "base"}`;
          return (
            <li
              key={lineKey}
              className="flex gap-5 rounded-sm border border-secondary/30 bg-card/40 p-4"
            >
              <Link href={`/tienda/${item.slug}`} className="relative h-24 w-24 shrink-0 overflow-hidden rounded-sm bg-card">
                {item.image && <Image src={item.image} alt={item.name} fill sizes="96px" className="object-cover" />}
              </Link>
              <div className="flex-1">
                <Link href={`/tienda/${item.slug}`} className="font-display text-sm uppercase tracking-tight text-foreground hover:text-primary">
                  {item.name}
                </Link>
                <p className="mt-1 text-sm text-primary">{formatCurrency(item.unitPrice, item.currency)}</p>
                <div className="mt-3 flex flex-wrap items-center gap-4">
                  <div className="flex items-center rounded-sm border border-secondary/40">
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center text-foreground/70 transition-colors duration-220 hover:text-primary"
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                      aria-label={`Restar cantidad de ${item.name}`}
                    >
                      −
                    </button>
                    <span className="w-10 text-center text-sm text-foreground" aria-live="polite">
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      className="flex h-9 w-9 items-center justify-center text-foreground/70 transition-colors duration-220 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                      onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                      disabled={item.quantity >= maxQuantityForStock(item.stock)}
                      aria-label={`Sumar cantidad de ${item.name}`}
                    >
                      +
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.productId, item.variantId)}
                    className="text-xs text-foreground/40 transition-colors duration-220 hover:text-primary"
                  >
                    Quitar
                  </button>
                  <span className="ml-auto font-display text-sm text-foreground">
                    {formatCurrency(item.unitPrice * item.quantity, item.currency)}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <aside className="h-fit rounded-sm border border-secondary/30 bg-card/40 p-6">
        <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Resumen</h2>
        <div className="mt-4 flex items-center justify-between text-sm text-foreground/70">
          <span>Subtotal</span>
          <span className="font-display text-lg text-foreground">{formatCurrency(subtotal, currency)}</span>
        </div>
        <p className="mt-2 text-xs text-foreground/40">
          El costo de envío se coordina después de confirmar el pedido.
        </p>
        <Button href="/checkout" size="lg" className="mt-6 w-full">
          Continuar a checkout
        </Button>
        <div className="mt-3 text-center">
          <Link href="/tienda" className="text-xs text-foreground/50 hover:text-primary">
            Seguir comprando
          </Link>
        </div>
      </aside>
    </div>
  );
}
