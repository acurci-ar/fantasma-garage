import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/features/admin/ProductForm";
import { DeleteProductButton } from "@/features/admin/DeleteProductButton";
import { updateProduct } from "@/actions/admin/products";
import type { Product } from "@/types/database";

export const metadata: Metadata = { title: "Editar producto", robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("*, images:product_images(*)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const typedProduct = product as Product;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedProduct.name}
        </h1>
        <DeleteProductButton id={id} />
      </div>
      <div className="mt-8 max-w-2xl">
        <ProductForm action={updateProduct.bind(null, id)} product={typedProduct} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
