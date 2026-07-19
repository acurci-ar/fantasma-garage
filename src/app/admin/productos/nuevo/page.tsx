import type { Metadata } from "next";
import { ProductForm } from "@/features/admin/ProductForm";
import { createProduct } from "@/actions/admin/products";

export const metadata: Metadata = { title: "Nuevo producto", robots: { index: false, follow: false } };

export default function NewProductPage() {
  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Nuevo producto
      </h1>
      <div className="mt-8 max-w-2xl">
        <ProductForm action={createProduct} submitLabel="Crear producto" />
      </div>
    </div>
  );
}
