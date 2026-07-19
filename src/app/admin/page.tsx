import type { Metadata } from "next";
import Link from "next/link";
import { Panel } from "@/components/ui/Card";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export const metadata: Metadata = { title: "Panel de administración", robots: { index: false, follow: false } };

interface Kpi {
  label: string;
  value: string;
  href?: string;
}

async function getKpis(): Promise<Kpi[]> {
  if (!isSupabaseConfigured()) {
    return [
      { label: "Productos publicados", value: "—" },
      { label: "Stock bajo", value: "—" },
      { label: "Pedidos pendientes de pago", value: "—" },
      { label: "Mensajes nuevos", value: "—" },
    ];
  }

  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ count: products }, { count: pendingOrders }, { count: newMessages }, { data: stockRows }] =
    await Promise.all([
      supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "published"),
      supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "pendiente_pago"),
      supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("status", "nuevo"),
      supabase.from("products").select("stock, low_stock_threshold").eq("status", "published"),
    ]);

  const lowStockCount = (stockRows ?? []).filter((p) => p.stock <= p.low_stock_threshold).length;

  return [
    { label: "Productos publicados", value: String(products ?? 0), href: "/admin/productos" },
    { label: "Stock bajo", value: String(lowStockCount), href: "/admin/productos" },
    { label: "Pedidos pendientes de pago", value: String(pendingOrders ?? 0), href: "/admin/pedidos" },
    { label: "Mensajes nuevos", value: String(newMessages ?? 0) },
  ];
}

export default async function AdminDashboardPage() {
  const kpis = await getKpis();

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Dashboard</h1>
      <p className="mt-2 text-sm text-foreground/60">Resumen general de la tienda y el contenido.</p>

      {!isSupabaseConfigured() && (
        <p className="mt-4 text-xs text-primary">
          Supabase no está configurado en este entorno (modo demo): los números reales aparecen cuando esté
          conectado.
        </p>
      )}

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => {
          const inner = (
            <>
              <p className="text-xs uppercase tracking-wide text-foreground/50">{kpi.label}</p>
              <p className="mt-2 font-display text-3xl text-primary">{kpi.value}</p>
            </>
          );
          if (kpi.href) {
            return (
              <Link
                key={kpi.label}
                href={kpi.href}
                className="block rounded-sm border border-secondary/40 bg-card/60 p-6 transition-colors duration-220 hover:border-primary/60"
              >
                {inner}
              </Link>
            );
          }
          return (
            <Panel key={kpi.label}>{inner}</Panel>
          );
        })}
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        <Panel>
          <p className="font-display text-sm uppercase tracking-wide text-foreground/80">Productos</p>
          <p className="mt-2 text-xs text-foreground/45">Alta, edición, stock y estado del catálogo.</p>
          <Link href="/admin/productos" className="mt-4 inline-block text-xs font-semibold uppercase text-primary hover:underline">
            Ir a productos →
          </Link>
        </Panel>
        <Panel>
          <p className="font-display text-sm uppercase tracking-wide text-foreground/80">Pedidos</p>
          <p className="mt-2 text-xs text-foreground/45">
            Seguimiento y cambio manual de estado de pago/envío (hasta integrar Mercado Pago).
          </p>
          <Link href="/admin/pedidos" className="mt-4 inline-block text-xs font-semibold uppercase text-primary hover:underline">
            Ir a pedidos →
          </Link>
        </Panel>
      </div>

      <p className="mt-10 text-xs text-foreground/40">
        Proyectos, galerías, videos, testimonios, mensajes de contacto y configuración del sitio quedan para
        una próxima iteración del panel (ver informe de avance).
      </p>
    </div>
  );
}
