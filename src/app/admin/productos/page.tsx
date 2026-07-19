import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency } from "@/lib/utils/format";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Product } from "@/types/database";

export const metadata: Metadata = { title: "Productos", robots: { index: false, follow: false } };

async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured()) return [];
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, images:product_images(*)")
    .order("created_at", { ascending: false });
  return (data ?? []) as Product[];
}

const statusTone: Record<string, "default" | "primary"> = {
  published: "primary",
  draft: "default",
  hidden: "default",
  discontinued: "default",
};

const statusLabel: Record<string, string> = {
  published: "Publicado",
  draft: "Borrador",
  hidden: "Oculto",
  discontinued: "Discontinuado",
};

export default async function AdminProductsPage() {
  const products = await getProducts();

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">Productos</h1>
          <p className="mt-2 text-sm text-foreground/60">{products.length} producto(s) en el catálogo.</p>
        </div>
        <Button href="/admin/productos/nuevo">Nuevo producto</Button>
      </div>

      {!isSupabaseConfigured() && (
        <p className="mt-6 text-sm text-foreground/50">
          Supabase no está configurado en este entorno (modo demo): el listado real aparece cuando esté
          conectado.
        </p>
      )}

      {isSupabaseConfigured() && products.length === 0 && (
        <p className="mt-10 text-sm text-foreground/50">Todavía no hay productos cargados.</p>
      )}

      {products.length > 0 && (
        <div className="mt-8 overflow-x-auto rounded-sm border border-secondary/30">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="border-b border-secondary/30 bg-card/40 text-xs uppercase tracking-wide text-foreground/50">
              <tr>
                <th className="px-4 py-3 font-semibold">Producto</th>
                <th className="px-4 py-3 font-semibold">SKU</th>
                <th className="px-4 py-3 font-semibold">Precio</th>
                <th className="px-4 py-3 font-semibold">Stock</th>
                <th className="px-4 py-3 font-semibold">Estado</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-secondary/15">
              {products.map((product) => {
                const lowStock = product.stock <= product.low_stock_threshold;
                return (
                  <tr key={product.id} className="hover:bg-card/30">
                    <td className="px-4 py-3 text-foreground">{product.name}</td>
                    <td className="px-4 py-3 text-foreground/60">{product.sku}</td>
                    <td className="px-4 py-3 text-foreground/60">
                      {formatCurrency(product.sale_price ?? product.price, product.currency)}
                    </td>
                    <td className="px-4 py-3">
                      <span className={lowStock ? "font-semibold text-primary" : "text-foreground/60"}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={statusTone[product.status] ?? "default"}>
                        {statusLabel[product.status] ?? product.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/productos/${product.id}`}
                        className="text-xs font-semibold uppercase text-primary hover:underline"
                      >
                        Editar
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
