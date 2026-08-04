import type { Metadata } from "next";
import { ProductForm } from "@/features/admin/ProductForm";
import { createProduct } from "@/actions/admin/products";
import { getAllCategoriesForAdmin } from "@/lib/content/queries";
import { getCurrentRole } from "@/lib/supabase/role";

export const metadata: Metadata = { title: "Nuevo producto", robots: { index: false, follow: false } };

export default async function NewProductPage() {
  const [categories, role] = await Promise.all([getAllCategoriesForAdmin(), getCurrentRole()]);

  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Nuevo producto
      </h1>
      <div className="mt-8 max-w-2xl">
        <ProductForm
          action={createProduct}
          categories={categories}
          canSeeInternal={role === "admin"}
          submitLabel="Crear producto"
        />
      </div>
    </div>
  );
}
