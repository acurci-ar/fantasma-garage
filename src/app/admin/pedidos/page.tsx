import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
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

const columns: DataTableColumn[] = [
  { id: "pedido", header: "Pedido", sortable: true },
  { id: "cliente", header: "Cliente", sortable: true },
  { id: "fecha", header: "Fecha", sortable: true },
  { id: "total", header: "Total", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminOrdersPage() {
  const orders = await getOrders();

  const rows: DataTableRow[] = orders.map((order) => {
    const customer = order.customer_snapshot as { full_name?: string; email?: string };
    const status = statusLabel[order.status] ?? order.status;
    const shortId = order.id.slice(0, 8).toUpperCase();
    return {
      key: order.id,
      filterText: `${shortId} ${customer.full_name ?? ""} ${customer.email ?? ""} ${status}`,
      sortValues: {
        pedido: shortId,
        cliente: (customer.full_name ?? "").toLowerCase(),
        fecha: new Date(order.created_at).getTime(),
        total: order.total,
        estado: status,
      },
      cells: {
        pedido: <span className="font-mono text-xs text-foreground/70">#{shortId}</span>,
        cliente: (
          <span className="text-foreground">
            {customer.full_name ?? "—"}
            <span className="block text-xs text-foreground/40">{customer.email ?? ""}</span>
          </span>
        ),
        fecha: <span className="text-foreground/60">{formatDate(order.created_at)}</span>,
        total: <span className="text-foreground/60">{formatCurrency(order.total, order.currency)}</span>,
        estado: <Badge tone={statusTone[order.status] ?? "default"}>{status}</Badge>,
        acciones: (
          <Link href={`/admin/pedidos/${order.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
            Ver
          </Link>
        ),
      },
    };
  });

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

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay pedidos." searchPlaceholder="Buscar pedido o cliente..." />
        </div>
      )}
    </div>
  );
}
