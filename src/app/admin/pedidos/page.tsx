import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Order } from "@/types/database";

export const metadata: Metadata = { title: "Pedidos", robots: { index: false, follow: false } };

async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  return (data ?? []) as Order[];
}

const statusLabel: Record<string, string> = {
  pendiente_pago: "Pendiente de pago",
  pagado: "Pagado",
  preparando: "Preparando",
  enviado: "Enviado",
  entregado: "Entregado",
  cancelado: "Cancelado",
  reembolsado: "Reembolsado",
};

const statusTone: Record<string, "default" | "primary"> = {
  pendiente_pago: "default",
  pagado: "primary",
  preparando: "primary",
  enviado: "primary",
  entregado: "primary",
  cancelado: "default",
  reembolsado: "default",
};

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Pedidos</h1>
      <p className="mt-2 text-sm text-foreground/60">{orders.length} pedido(s) registrado(s).</p>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté
          conectado.
        </p>
      )}

      {isSupabaseConfigured() && orders.length === 0 && (
        <p className="mt-10 text-sm text-foreground/50">Todavía no hay pedidos.</p>
      )}

      {orders.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Pedido</th>
                <th className="px-4 py-3 font-semibold">Cliente</th>
                <th className="px-4 py-3 font-semibold">Fecha</th>
                <th className="px-4 py-3 font-semibold">Total</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {orders.map((order) => {
                const customer = order.customer_snapshot as { full_name?: string; email?: string };
                return (
                  <tr key={order.id} className="hover:bg-card/30">
                    <td className="px-4 py-3 font-mono text-xs text-foreground/70">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {customer.full_name ?? "—"}
                      <span className="block text-xs text-foreground/40">{customer.email ?? ""}</span>
                    </td>
                    <td className="px-4 py-3 text-foreground/60">{formatDate(order.created_at)}</td>
                    <td className="px-4 py-3 text-foreground/60">{formatCurrency(order.total, order.currency)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[order.status] ?? "default"}>
                        {statusLabel[order.status] ?? order.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/pedidos/${order.id}`}
                        className="text-xs font-semibold uppercase text-primary hover:underline"
                      >
                        Ver
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
