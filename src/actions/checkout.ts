"use server";

import { checkoutFormSchema } from "@/lib/validation/checkout";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface CheckoutActionState {
  status: "idle" | "success" | "error";
  message: string;
  orderId?: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Crea un pedido a partir del carrito (checkout sin pasarela de pago
 * todavía: el pedido queda 'pendiente_pago' y se coordina manualmente).
 *
 * Usa el cliente con SERVICE ROLE (lib/supabase/admin.ts) a propósito:
 * la policy RLS `order_items_staff_write` es la única que permite INSERT
 * en order_items, y no existe una policy pública de alta para esa tabla
 * (por diseño — ver supabase/migrations/0002_rls_policies.sql). El
 * checkout público es entonces la única vía de creación de pedidos y
 * necesita orquestar order + order_items + descuento de stock de forma
 * conjunta, así que se apoya en el cliente admin en vez de en la sesión
 * del comprador.
 *
 * Precisamente por bypassear RLS, esta función NUNCA confía en precios,
 * nombres ni stock que vengan del cliente: solo toma productId/variantId/
 * quantity y revalida todo contra la base antes de calcular el total.
 */
export async function createOrder(input: unknown): Promise<CheckoutActionState> {
  const parsed = checkoutFormSchema.safeParse(input);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const { items, ...customer } = parsed.data;

  if (!isSupabaseConfigured()) {
    return {
      status: "error",
      message:
        "Supabase no está configurado en este entorno (modo demo), así que no se puede registrar el pedido todavía.",
    };
  }

  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const { createClient } = await import("@/lib/supabase/server");
    const admin = createAdminClient();
    const authClient = await createClient();

    const {
      data: { user },
    } = await authClient.auth.getUser();

    const productIds = [...new Set(items.map((item) => item.productId))];
    const { data: products, error: productsError } = await admin
      .from("products")
      .select("id, name, sku, price, sale_price, currency, stock, status")
      .in("id", productIds);

    if (productsError) {
      // 22P02: "invalid input syntax for type uuid" — pasa si el carrito
      // guardado en localStorage viene de un momento en que el sitio corría
      // en modo demo (ids como "prod-1") y ahora Supabase ya está
      // configurado. El id ya no existe como producto real.
      if (productsError.code === "22P02") {
        return {
          status: "error",
          message:
            "Tu carrito tiene productos de una versión anterior del catálogo. Vaciá el carrito y agregalos de nuevo.",
        };
      }
      throw productsError;
    }

    const productMap = new Map((products ?? []).map((p) => [p.id as string, p]));

    const orderItems: Array<{
      product_id: string;
      variant_id: string | null;
      quantity: number;
      unit_price: number;
      product_snapshot: Record<string, unknown>;
    }> = [];

    let total = 0;
    let currency: "ARS" | "USD" = "ARS";

    for (const item of items) {
      const product = productMap.get(item.productId);
      if (!product || product.status !== "published") {
        return { status: "error", message: "Un producto de tu carrito ya no está disponible." };
      }
      // stock <= 0 = producto "a pedido" (ver AddToCartButton): se puede
      // pedir igual, no bloqueamos el checkout. Si hay stock real, sí se
      // respeta el límite de depósito.
      if (product.stock > 0 && product.stock < item.quantity) {
        return {
          status: "error",
          message: `No hay stock suficiente de "${product.name}" (quedan ${product.stock}).`,
        };
      }
      const unitPrice = Number(product.sale_price ?? product.price);
      total += unitPrice * item.quantity;
      currency = product.currency;
      orderItems.push({
        product_id: product.id,
        variant_id: item.variantId,
        quantity: item.quantity,
        unit_price: unitPrice,
        product_snapshot: { name: product.name, sku: product.sku },
      });
    }

    const { data: order, error: orderError } = await admin
      .from("orders")
      .insert({
        user_id: user?.id ?? null,
        status: "pendiente_pago",
        payment_status: "pendiente",
        total,
        currency,
        customer_snapshot: { full_name: customer.fullName, email: customer.email, phone: customer.phone },
        shipping_snapshot: {
          street: customer.street,
          city: customer.city,
          province: customer.province,
          postal_code: customer.postalCode,
          notes: customer.notes || null,
        },
      })
      .select("id")
      .single();

    if (orderError) throw orderError;

    const { error: itemsError } = await admin
      .from("order_items")
      .insert(orderItems.map((item) => ({ ...item, order_id: order.id })));

    if (itemsError) throw itemsError;

    // Reserva de stock: se descuenta ahora, no cuando se confirme el pago
    // (todavía no hay webhook de Mercado Pago). Queda registrado en
    // inventory_movements para que /admin pueda auditarlo o revertirlo si
    // el pedido se cancela. Los ítems "a pedido" (stock <= 0 al momento de
    // pedirlos) no descuentan stock — ya está en 0 y fabricarlo/conseguirlo
    // no es un movimiento de depósito — pero sí queda el registro para que
    // el staff sepa que hay que coordinarlo.
    for (const item of orderItems) {
      const product = productMap.get(item.product_id)!;
      if (product.stock > 0) {
        await admin
          .from("products")
          .update({ stock: Math.max(product.stock - item.quantity, 0) })
          .eq("id", item.product_id);
        await admin.from("inventory_movements").insert({
          product_id: item.product_id,
          variant_id: item.variant_id,
          type: "reserva",
          quantity: -item.quantity,
          reason: `Pedido ${order.id} (pago pendiente)`,
          actor_id: user?.id ?? null,
        });
      } else {
        await admin.from("inventory_movements").insert({
          product_id: item.product_id,
          variant_id: item.variant_id,
          type: "reserva",
          quantity: 0,
          reason: `Pedido ${order.id} — producto a pedido (sin stock): coordinar fabricación/compra.`,
          actor_id: user?.id ?? null,
        });
      }
    }

    return { status: "success", message: "Pedido creado.", orderId: order.id };
  } catch (error) {
    console.error("[checkout] Error al crear el pedido:", error);
    return {
      status: "error",
      message: "No pudimos registrar tu pedido. Probá de nuevo o contactanos por WhatsApp.",
    };
  }
}
