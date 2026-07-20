import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { Section } from "@/components/ui/Section";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Order, OrderItem } from "@/types/database";

export const metadata: Metadata = { title: "Detalle de pedido", robots: { index: false, follow: false } };

const statusLabel: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

export default async function AccountOrderDetailPage({ params }: { params: { id: string } }) {
  const { id } = params;

  if (!isSupabaseConfigured()) redirect("/cuenta");

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Sin cliente admin acá a propósito: la RLS `orders_select_own_or_staff`
  // (auth.uid() = user_id) es la que decide si este pedido es tuyo. Si no
  // lo es, la consulta simplemente no devuelve filas — no hace falta
  // chequear el dueño a mano.
  const { data: order } = await supabase
    .from("orders")
    .select("*, items:order_items(*)")
    .eq("id", id)
    .single();

  if (!order) notFound();

  const typedOrder = order as Order & { items: OrderItem[] };
  const shipping = typedOrder.shipping_snapshot as {
    street?: string;
    city?: string;
    province?: string;
    postal_code?: string;
  };

  return (
    <Section className="pt-32">
      <SectionHeading
        eyebrow="Mi cuenta"
        title={`Pedido #${typedOrder.id.slice(0, 8).toUpperCase()}`}
        description={formatDate(typedOrder.created_at)}
      />

      <div className="mx-auto mt-10 max-w-2xl rounded-sm border border-secondary/30 bg-card/40 p-6">
        <Badge tone="primary">{statusLabel[typedOrder.status] ?? typedOrder.status}</Badge>

        <ul className="mt-6 space-y-3 border-t border-secondary/20 pt-6">
          {typedOrder.items.map((item) => {
            const snapshot = item.product_snapshot as { name?: string };
            return (
              <li key={item.id} className="flex justify-between gap-3 text-sm text-foreground/70">
                <span>
                  {snapshot.name ?? "Producto"} × {item.quantity}
                </span>
                <span className="text-foreground">
                  {formatCurrency(item.unit_price * item.quantity, typedOrder.currency)}
                </span>
              </li>
            );
          })}
        </ul>

        <div className="mt-6 flex items-center justify-between border-t border-secondary/20 pt-6 text-sm">
          <span className="text-foreground/70">Total</span>
          <span className="font-display text-xl text-primary">
            {formatCurrency(typedOrder.total, typedOrder.currency)}
          </span>
        </div>

        <div className="mt-6 border-t border-secondary/20 pt-6 text-sm text-foreground/70">
          <p className="text-xs uppercase tracking-wide text-foreground/40">Envío</p>
          <p className="mt-1">
            {shipping.street ?? "—"}, {shipping.city ?? ""} ({shipping.postal_code ?? ""}), {shipping.province ?? ""}
          </p>
          {typedOrder.tracking_number && (
            <p className="mt-2">
              N° de seguimiento: <span className="text-foreground">{typedOrder.tracking_number}</span>
            </p>
          )}
        </div>
      </div>
    </Section>
  );
}
