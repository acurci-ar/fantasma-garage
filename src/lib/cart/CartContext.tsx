"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { CartItem } from "@/lib/cart/types";

const STORAGE_KEY = "fantasma-garage:cart";

interface CartContextValue {
  items: CartItem[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (productId: string, variantId: string | null, quantity: number) => void;
  removeItem: (productId: string, variantId: string | null) => void;
  clear: () => void;
  count: number;
  subtotal: number;
  currency: "ARS" | "USD";
}

const CartContext = createContext<CartContextValue | null>(null);

function sameLine(item: CartItem, productId: string, variantId: string | null) {
  return item.productId === productId && item.variantId === variantId;
}

/** Sin stock (<=0) = producto "a pedido": no hay tope por depósito. Con stock, sigue acotado a lo disponible. Exportado para que CartDrawer/CartPageContent usen el mismo criterio al deshabilitar el "+". */
export function maxQuantityForStock(stock: number): number {
  return stock > 0 ? stock : Infinity;
}

/**
 * Estado del carrito en el cliente, persistido en localStorage.
 *
 * No se guarda en Supabase ni requiere sesión: es intencionalmente un
 * carrito de invitado (guest cart) hasta el paso de checkout, donde recién
 * se crea el pedido en el servidor. Asume una sola moneda por carrito (ARS
 * en la práctica, único catálogo actual); si en el futuro conviven ARS/USD
 * habría que separar el carrito por moneda.
 */
export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // localStorage no disponible o dato corrupto: arrancamos con carrito vacío.
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // Almacenamiento lleno o no disponible: el carrito sigue funcionando en memoria.
    }
  }, [items, hydrated]);

  function addItem(item: Omit<CartItem, "quantity">, quantity = 1) {
    // stock <= 0 = producto "a pedido": no lo fabricamos/conseguimos desde
    // stock de depósito, así que no tiene sentido tope de cantidad por
    // stock (ver maxQuantityForStock). Sí se mantiene el tope de 1-99 de
    // checkoutItemSchema más adelante en el flujo.
    const max = maxQuantityForStock(item.stock);
    setItems((prev) => {
      const existing = prev.find((i) => sameLine(i, item.productId, item.variantId));
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, max);
        return prev.map((i) =>
          sameLine(i, item.productId, item.variantId) ? { ...i, quantity: nextQty, stock: item.stock } : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(Math.max(quantity, 1), max) }];
    });
    setIsOpen(true);
  }

  function updateQuantity(productId: string, variantId: string | null, quantity: number) {
    setItems((prev) =>
      prev
        .map((i) =>
          sameLine(i, productId, variantId) ? { ...i, quantity: Math.max(0, Math.min(quantity, maxQuantityForStock(i.stock))) } : i
        )
        .filter((i) => i.quantity > 0)
    );
  }

  function removeItem(productId: string, variantId: string | null) {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, variantId)));
  }

  function clear() {
    setItems([]);
  }

  const { count, subtotal, currency } = useMemo(() => {
    return {
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      subtotal: items.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0),
      currency: items[0]?.currency ?? ("ARS" as const),
    };
  }, [items]);

  const value: CartContextValue = {
    items,
    isOpen,
    openCart: () => setIsOpen(true),
    closeCart: () => setIsOpen(false),
    addItem,
    updateQuantity,
    removeItem,
    clear,
    count,
    subtotal,
    currency,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart debe usarse dentro de <CartProvider>.");
  }
  return ctx;
}
