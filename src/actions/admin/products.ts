"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { productSchema, productInternalSchema } from "@/lib/validation/product";
import { productImageSchema } from "@/lib/validation/admin/productImage";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket } from "@/lib/supabase/upload";
import { computeSuggestedPrice, skuConflictFieldErrors } from "@/lib/utils/productPricing";

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
 * app/admin/layout.tsx (sección 7.1 — defensa en profundidad). Lo mismo
 * aplica al bucket de Storage `product-images` (ver
 * supabase/migrations/0003_storage.sql): solo staff puede escribir ahí.
 *
 * La info interna (product_internal_info) tiene su propia RLS más estricta
 * (solo is_admin(), ni siquiera editor — ver 0018_products_catalog_extras.sql):
 * si quien guarda es editor, el form ni siquiera manda esos campos
 * (ProductForm los oculta según el rol), así que acá directamente no se
 * intenta el upsert si vienen todos vacíos.
 */
function parseProductForm(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  // Si no se cargó SKU a mano, se autocompleta con el slug (pedido del
  // smoke test): el slug ya es único y con el mismo formato de caracteres,
  // así que sirve como SKU razonable por defecto y sigue siendo editable.
  const skuRaw = String(formData.get("sku") ?? "").trim();
  const sku = skuRaw === "" ? slug : skuRaw;

  const raw = {
    name: String(formData.get("name") ?? ""),
    slug,
    sku,
    short_description: String(formData.get("short_description") ?? ""),
    description: String(formData.get("description") ?? ""),
    price: String(formData.get("price") ?? ""),
    sale_price: String(formData.get("sale_price") ?? ""),
    stock: String(formData.get("stock") ?? ""),
    low_stock_threshold: String(formData.get("low_stock_threshold") ?? "2"),
    currency: String(formData.get("currency") ?? "ARS"),
    status: String(formData.get("status") ?? "draft"),
    category_id: String(formData.get("category_id") ?? ""),
    featured: formData.get("featured") === "on",
  };
  return productSchema.safeParse(raw);
}

function parseProductInternalForm(formData: FormData) {
  return productInternalSchema.safeParse({
    supplier_name: String(formData.get("supplier_name") ?? ""),
    supplier_link: String(formData.get("supplier_link") ?? ""),
    cost_price: String(formData.get("cost_price") ?? ""),
    weight_kg: String(formData.get("weight_kg") ?? ""),
    shipping_cost: String(formData.get("shipping_cost") ?? ""),
    // Campo del form se llama "internal_currency" (no "currency" a secas)
    // para no chocar con el <select name="currency"> del precio público.
    currency: String(formData.get("internal_currency") || "USD"),
  });
}

// computeSuggestedPrice y skuConflictFieldErrors viven en @/lib/utils/productPricing
// (pura, testeada en tests/productPricing.test.ts — fase 1 del plan de cobertura de Tomás).

async function upsertInternalInfo(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string,
  internal: {
    supplier_name: string;
    supplier_link: string | null;
    cost_price: number | null;
    weight_kg: number | null;
    shipping_cost: number | null;
    currency: "ARS" | "USD";
  }
) {
  const hasAnyValue =
    internal.supplier_name !== "" ||
    internal.supplier_link !== null ||
    internal.cost_price !== null ||
    internal.weight_kg !== null ||
    internal.shipping_cost !== null;
  if (!hasAnyValue) return;

  // Best-effort: si quien guarda no es admin, la RLS de product_internal_info
  // rechaza el upsert — no debe tirar abajo el guardado del producto en sí.
  await supabase.from("product_internal_info").upsert(
    {
      product_id: productId,
      supplier_name: internal.supplier_name === "" ? null : internal.supplier_name,
      supplier_link: internal.supplier_link,
      cost_price: internal.cost_price,
      weight_kg: internal.weight_kg,
      shipping_cost: internal.shipping_cost,
      currency: internal.currency,
    },
    { onConflict: "product_id" }
  );
}

export async function createProduct(
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsedInternal = parseProductInternalForm(formData);
  if (!parsedInternal.success) {
    return { status: "error", message: "Revisá los datos de información interna.", fieldErrors: parsedInternal.error.flatten().fieldErrors };
  }

  // Si el precio llegó vacío y hay datos de costo cargados, se completa con
  // el Precio Sugerido antes de validar (sigue siendo editable: esto es solo
  // el valor con el que se guarda si el staff no lo tocó).
  if (String(formData.get("price") ?? "").trim() === "") {
    const { cost_price, weight_kg, shipping_cost } = parsedInternal.data;
    if (cost_price !== null || weight_kg !== null) {
      formData.set("price", String(computeSuggestedPrice(cost_price, weight_kg, shipping_cost)));
    }
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const price = parsed.data.price;
  if (price === null) {
    return { status: "error", message: "Ingresá un precio.", fieldErrors: { price: ["Ingresá un precio."] } };
  }

  const supabase = await createClient();
  const { category_id, ...rest } = parsed.data;
  const productData = { ...rest, price, category_id: category_id === "" ? null : category_id };

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
      fieldErrors: skuConflictFieldErrors(error),
    };
  }

  await upsertInternalInfo(supabase, product.id, parsedInternal.data);

  revalidatePath("/admin/productos");
  revalidatePath("/tienda");
  redirect(`/admin/productos/${product.id}`);
}

export async function updateProduct(
  id: string,
  _prevState: ProductActionState,
  formData: FormData
): Promise<ProductActionState> {
  const parsedInternal = parseProductInternalForm(formData);
  if (!parsedInternal.success) {
    return { status: "error", message: "Revisá los datos de información interna.", fieldErrors: parsedInternal.error.flatten().fieldErrors };
  }

  if (String(formData.get("price") ?? "").trim() === "") {
    const { cost_price, weight_kg, shipping_cost } = parsedInternal.data;
    if (cost_price !== null || weight_kg !== null) {
      formData.set("price", String(computeSuggestedPrice(cost_price, weight_kg, shipping_cost)));
    }
  }

  const parsed = parseProductForm(formData);
  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }
  const price = parsed.data.price;
  if (price === null) {
    return { status: "error", message: "Ingresá un precio.", fieldErrors: { price: ["Ingresá un precio."] } };
  }

  const supabase = await createClient();
  const { category_id, ...rest } = parsed.data;
  const productData = { ...rest, price, category_id: category_id === "" ? null : category_id };

  const { error } = await supabase.from("products").update(productData).eq("id", id);
  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505" ? "Ya existe un producto con ese slug o SKU." : "No pudimos actualizar el producto.",
      fieldErrors: skuConflictFieldErrors(error),
    };
  }

  await upsertInternalInfo(supabase, id, parsedInternal.data);

  revalidatePath("/admin/productos");
  revalidatePath(`/admin/productos/${id}`);
  revalidatePath("/tienda");
  revalidatePath(`/tienda/${productData.slug}`);
  revalidatePath("/");

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
  revalidatePath("/");
  return { status: "success", message: "Producto eliminado." };
}

// ---------------------------------------------------------------------------
// Galería de fotos (product_images) — mismo patrón que
// actions/admin/projects.ts (ProjectImageManager): la portada es la foto en
// `position` más baja, y se reordena arrastrando en /admin/productos/[id].
// ---------------------------------------------------------------------------

export interface ProductImageActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

function parseProductImageForm(formData: FormData) {
  return productImageSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    alt: String(formData.get("alt") ?? ""),
  });
}

export async function addProductImage(
  productId: string,
  _prevState: ProductImageActionState,
  formData: FormData
): Promise<ProductImageActionState> {
  const parsed = parseProductImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, ...imageData } = parsed.data;

  let finalUrl = url;
  let finalThumbUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "product-images", productId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
    finalThumbUrl = uploaded.thumbUrl;
  }

  if (!finalUrl) {
    return { status: "error", message: "Subí una imagen o pegá una URL." };
  }

  const { data: lastImage } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("product_images").insert({
    ...imageData,
    position: (lastImage?.position ?? -1) + 1,
    url: finalUrl,
    thumb_url: finalThumbUrl,
    product_id: productId,
  });

  if (error) {
    return { status: "error", message: "No pudimos agregar la imagen." };
  }

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
  return { status: "success", message: "Imagen agregada." };
}

export async function updateProductImage(
  id: string,
  productId: string,
  _prevState: ProductImageActionState,
  formData: FormData
): Promise<ProductImageActionState> {
  const parsed = parseProductImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, ...imageData } = parsed.data;

  const { data: existingImage } = await supabase
    .from("product_images")
    .select("url, thumb_url")
    .eq("id", id)
    .maybeSingle();

  let finalUrl = url;
  let finalThumbUrl: string | null = existingImage?.url === url ? existingImage?.thumb_url ?? null : null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "product-images", productId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
    finalThumbUrl = uploaded.thumbUrl;
  }

  const update: Record<string, unknown> = { ...imageData, thumb_url: finalThumbUrl };
  if (finalUrl) update.url = finalUrl;

  const { error } = await supabase.from("product_images").update(update).eq("id", id);
  if (error) {
    return { status: "error", message: "No pudimos actualizar la imagen." };
  }

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
  return { status: "success", message: "Imagen actualizada." };
}

export async function deleteProductImage(
  id: string,
  productId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("product_images").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar la imagen." };
  }

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
  return { status: "success", message: "Imagen eliminada." };
}

/** Persiste el orden de arrastre de las fotos: recibe los ids en el orden final y les asigna position 0..n-1 (la primera queda como portada del producto). */
export async function reorderProductImages(
  productId: string,
  orderedIds: string[]
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("product_images").update({ position: index }).eq("id", id))
  );
  const error = results.find((r) => r.error)?.error;

  if (error) {
    return { status: "error", message: "No pudimos guardar el nuevo orden." };
  }

  revalidatePath(`/admin/productos/${productId}`);
  revalidatePath("/tienda");
  return { status: "success", message: "Orden guardado." };
}
