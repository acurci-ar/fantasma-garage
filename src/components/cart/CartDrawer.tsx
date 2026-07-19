"use client";

import Image from "next/image";
import { useCart } from "@/lib/cart/CartContext";
import { formatCurrency } from "@/lib/utils/format";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

/**
 * Drawer lateral del carrito (sección "Carrito persistente" de la Etapa 2).
 * Se monta una sola vez en el layout raíz y se muestra/oculta vía CartContext,
 * así el estado sobrevive a la navegación entre páginas.
 */
export function CartDrawer() {
  const { items, isOpen, closeCart, updateQuantity, removeItem, subtotal, currency } = useCart();

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 z-[60] bg-background/70 backdrop-blur-sm transition-opacity duration-220 ease-out motion-reduce:transition-none",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeCart}
        aria-hidden="true"
      />
      <aside
        className={cn(
          "fixed inset-y-0 right-0 z-[61] flex w-full max-w-md flex-col border-l border-secondary/30 bg-background transition-transform duration-320 ease-out motion-reduce:transition-none",
          isOpen ? "translate-x-0" : "translate-x-full"
        )}
        role="dialog"
        aria-modal="true"
        aria-label="Carrito de compras"
        aria-hidden={!isOpen}
      >
        <div className="flex items-center justify-between border-b border-secondary/20 px-6 py-5">
          <h2 className="font-display text-lg uppercase tracking-wide text-foreground">Tu carrito</h2>
          <button
            type="button"
            onClick={closeCart}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-secondary/40 text-foreground/70 transition-colors duration-220 hover:text-primary"
            aria-label="Cerrar carrito"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 4l12 12M16 4L4 16" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          {items.length === 0 ? (
            <p className="text-sm text-foreground/50">Todavía no agregaste productos.</p>
          ) : (
            <ul className="space-y-5">
              {items.map((item) => {
                const lineKey = `${item.productId}-${item.variantId ?? "base"}`;
                return (
                  <li key={lineKey} className="flex gap-4">
                    <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-sm bg-card">
                      {item.image && (
                        <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-display text-sm uppercase tracking-tight text-foreground">{item.name}</p>
                      <p className="mt-1 text-sm text-primary">{formatCurrency(item.unitPrice, item.currency)}</p>
                      <div className="mt-2 flex items-center gap-3">
                        <div className="flex items-center rounded-sm border border-secondary/40">
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center text-foreground/70 transition-colors duration-220 hover:text-primary"
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity - 1)}
                            aria-label={`Restar cantidad de ${item.name}`}
                          >
                            −
                          </button>
                          <span className="w-8 text-center text-sm text-foreground" aria-live="polite">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            className="flex h-8 w-8 items-center justify-center text-foreground/70 transition-colors duration-220 hover:text-primary disabled:cursor-not-allowed disabled:opacity-30"
                            onClick={() => updateQuantity(item.productId, item.variantId, item.quantity + 1)}
                            disabled={item.quantity >= item.stock}
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
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-secondary/20 px-6 py-5">
            <div className="flex items-center justify-between text-sm text-foreground/70">
              <span>Subtotal</span>
              <span className="font-display text-lg text-foreground">{formatCurrency(subtotal, currency)}</span>
            </div>
            <p className="mt-1 text-xs text-foreground/40">
              Envío a coordinar. El pago se confirma en el paso siguiente.
            </p>
            <div onClick={closeCart}>
              <Button href="/checkout" size="lg" className="mt-4 w-full">
                Iniciar compra
              </Button>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
