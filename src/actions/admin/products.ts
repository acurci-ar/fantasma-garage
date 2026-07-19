"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productSchema } from "@/lib/validation/product";
import { createClient } from "@/lib/supabase/server";

export interface ProductActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Acciones de administración de productos. Usan el cliente Supabase con la
 * sesión del usuario logueado (no el service role): la RLS
 * `products_staff_write` ya exige rol admin/editor, así que actúa como
 * segunda barrera de seguridad además del chequeo de rol en
 * app/admin/layout.tsx (sección 7.1 — defensa en profundidad).
 */
function parseProductForm(formData: FormData) {
  const raw = {
    name: String(formData.get("name") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    sku: String(formData.get("sku") ?? ""),
    short_description: String(formData.get("short_description") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    sale_price: String(formData.get("sale_price") ?? ""),
    stock: String(formData.get("stock") ?? ""),
    low_stock_threshold: String(formData.get("low_stock_threshold") ?? "2"),
    currency: String(formData.get("currency") ?? "ARS"),
    status: String(formData.get("status") ?? "draft"),
    image_url: String(formData.get("image_url") ?? ""),
    image_alt: String(formData.get("image_alt") ?? ""),
  };
  return productSchema.safeParse(raw);
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { image_url, image_alt, ...productData } = parsed.data;

  const { data: product, error } = await supabase
    .from("products")
    .insert(productData)
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505" ? "Ya existe un producto con ese slug o SKU." : "No pudimos crear el producto.",
    };
  }

  if (image_url) {
    await supabase
      .from("product_images")
      .insert({ product_id: product.id, url: image_url, alt: image_alt || productData.name, position: 1 });
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect(`/admin/productos/${product.id}`);
}

export async function updateProduct(
  id: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const { image_url, image_alt, ...productData } = parsed.data;

  const { error } = await supabase.from("products").update(productData).eq("id", id);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505" ? "Ya existe un producto con ese slug o SKU." : "No pudimos actualizar el producto.",
    };
  }

  if (image_url) {
    await supabase.from("product_images").delete().eq("product_id", id);
    await supabase
      .from("product_images")
      .insert({ product_id: id, url: image_url, alt: image_alt || productData.name, position: 1 });
  }

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/tienda");
  revalidatePath(`/tienda/${productData.slug}`);

  return { status: "success", message: "Producto actualizado." };
}

export async function deleteProduct(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("products").delete().eq("id", id);

  if (error) {
    return {
      status: "error",
      message:
        "No se pudo eliminar (probablemente tiene pedidos asociados). Marcalo como 'discontinued' en su lugar.",
    };
  }

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  return { status: "success", message: "Producto eliminado." };
}
