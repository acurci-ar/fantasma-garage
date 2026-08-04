import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductForm } from "@/features/admin/ProductForm";
import { ProductImageManager } from "@/features/admin/ProductImageManager";
import { ProductImageForm } from "@/features/admin/ProductImageForm";
import { DeleteProductButton } from "@/features/admin/DeleteProductButton";
import { updateProduct, addProductImage } from "@/actions/admin/products";
import { getAllCategoriesForAdmin } from "@/lib/content/queries";
import { getCurrentRole } from "@/lib/supabase/role";
import type { Product } from "@/types/database";

export const metadata: Metadata = { title: "Editar producto", robots: { index: false, follow: false } };

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();

  const [{ data: product }, categories, role] = await Promise.all([
    supabase
      .from("products")
      .select("*, images:product_images(*), internal:product_internal_info(*)")
      .eq("id", id)
      .single(),
    getAllCategoriesForAdmin(),
    getCurrentRole(),
  ]);

  if (!product) notFound();

  // El embed a-uno de product_internal_info llega como array desde
  // PostgREST cuando no hay FK única declarada en un solo sentido; acá sí es
  // 1:1 (product_id es la PK), pero normalizamos igual por si acaso.
  const rawInternal = (product as unknown as { internal: unknown }).internal;
  const typedProduct: Product = {
    ...(product as Product),
    internal: Array.isArray(rawInternal) ? (rawInternal[0] ?? null) : ((rawInternal as Product["internal"]) ?? null),
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedProduct.name}
        </h1>
        <DeleteProductButton id={id} />
      </div>
      <div className="mt-8 max-w-2xl">
        <ProductForm
          action={updateProduct.bind(null, id)}
          product={typedProduct}
          categories={categories}
          canSeeInternal={role === "admin"}
          submitLabel="Guardar cambios"
        />
      </div>

      <div className="mt-12 max-w-2xl">
        <h2 className="font-display text-lg uppercase tracking-tight text-foreground">Fotos</h2>
        <p className="mt-2 text-sm text-foreground/60">
          La primera foto es la portada en catálogo, home y ficha. Arrastrá el ícono de agarre para reordenar.
        </p>
        <div className="mt-6">
          <ProductImageManager images={typedProduct.images} productId={id} />
        </div>
        <div className="mt-6">
          <ProductImageForm action={addProductImage.bind(null, id)} submitLabel="Agregar foto" />
        </div>
      </div>
    </div>
  );
}
