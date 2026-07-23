import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { DataTable, type DataTableColumn, type DataTableRow } from "@/components/admin/DataTable";
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

const columns: DataTableColumn[] = [
  { id: "producto", header: "Producto", sortable: true },
  { id: "sku", header: "SKU", sortable: true },
  { id: "precio", header: "Precio", sortable: true },
  { id: "stock", header: "Stock", sortable: true },
  { id: "estado", header: "Estado", sortable: true },
  { id: "acciones", header: "", align: "right" },
];

export default async function AdminProductsPage() {
  const products = await getProducts();

  const rows: DataTableRow[] = products.map((product) => {
    const lowStock = product.stock <= product.low_stock_threshold;
    const price = product.sale_price ?? product.price;
    const status = statusLabel[product.status] ?? product.status;
    return {
      key: product.id,
      filterText: `${product.name} ${product.sku} ${status}`,
      sortValues: {
        producto: product.name.toLowerCase(),
        sku: product.sku.toLowerCase(),
        precio: price,
        stock: product.stock,
        estado: status,
      },
      cells: {
        producto: <span className="text-foreground">{product.name}</span>,
        sku: <span className="text-foreground/60">{product.sku}</span>,
        precio: <span className="text-foreground/60">{formatCurrency(price, product.currency)}</span>,
        stock: <span className={lowStock ? "font-semibold text-primary" : "text-foreground/60"}>{product.stock}</span>,
        estado: <Badge tone={statusTone[product.status] ?? "default"}>{status}</Badge>,
        acciones: (
          <Link href={`/admin/productos/${product.id}`} className="text-xs font-semibold uppercase text-primary hover:underline">
            Editar
          </Link>
        ),
      },
    };
  });

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

      {isSupabaseConfigured() && (
        <div className="mt-8">
          <DataTable columns={columns} rows={rows} emptyMessage="Todavía no hay productos cargados." searchPlaceholder="Buscar producto o SKU..." />
        </div>
      )}
    </div>
  );
}
