import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { OrderStatusForm } from "@/features/admin/OrderStatusForm";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import type { Order, OrderItem } from "@/types/database";

export const metadata: Metadata = { title: "Detalle de pedido", robots: { index: false, follow: false } };

export default async function AdminOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const typedOrder = order as Order & { items: OrderItem[] };
  const customer = typedOrder.customer_snapshot as {
    full_name?: string;
    email?: string;
    phone?: string;
  };
  const shipping = typedOrder.shipping_snapshot as {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
    notes?: string | null;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          Pedido #{typedOrder.id.slice(0, 8).toUpperCase()}
        </h1>
        <Badge tone="primary">{formatDate(typedOrder.created_at)}</Badge>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          <div className="rounded-sm border border-secondary/30 bg-card/40 p-6">
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Ítems</h2>
            <ul className="mt-4 space-y-3">
              {typedOrder.items.map((item) => {
                const snapshot = item.product_snapshot as { name?: string; sku?: string };
                return (
                  <li key={item.id} className="flex justify-between gap-3 text-sm text-foreground/70">
                    <span>
                      {snapshot.name ?? "Producto"} × {item.quantity}
                      {snapshot.sku && <span className="ml-2 text-xs text-foreground/40">SKU {snapshot.sku}</span>}
                    </span>
                    <span className="text-foreground">
                      {formatCurrency(item.unit_price * item.quantity, typedOrder.currency)}
                    </span>
                  </li>
                );
              })}
            </ul>
            <div className="mt-4 flex items-center justify-between border-t border-secondary/20 pt-4 text-sm">
              <span className="text-foreground/70">Total</span>
              <span className="font-display text-xl text-primary">
                {formatCurrency(typedOrder.total, typedOrder.currency)}
              </span>
            </div>
          </div>

          <div className="rounded-sm border border-secondary/30 bg-card/40 p-6">
            <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Cliente y envío</h2>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs uppercase tracking-wide text-foreground/40">Nombre</dt>
                <dd className="text-foreground/80">{customer.full_name ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-foreground/40">Email</dt>
                <dd className="text-foreground/80">{customer.email ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-foreground/40">Teléfono</dt>
                <dd className="text-foreground/80">{customer.phone ?? "—"}</dd>
              </div>
              <div>
                <dt className="text-xs uppercase tracking-wide text-foreground/40">Dirección</dt>
                <dd className="text-foreground/80">
                  {shipping.street ?? "—"}, {shipping.city ?? ""} ({shipping.postal_code ?? ""}), {shipping.province ?? ""}
                </dd>
              </div>
              {shipping.notes && (
                <div className="sm:col-span-2">
                  <dt className="text-xs uppercase tracking-wide text-foreground/40">Notas de entrega</dt>
                  <dd className="text-foreground/80">{shipping.notes}</dd>
                </div>
              )}
            </dl>
          </div>
        </div>

        <div className="h-fit rounded-sm border border-secondary/30 bg-card/40 p-6">
          <h2 className="font-display text-sm uppercase tracking-wide text-foreground/70">Estado</h2>
          <div className="mt-4">
            <OrderStatusForm order={typedOrder} />
          </div>
        </div>
      </div>
    </div>
  );
}
