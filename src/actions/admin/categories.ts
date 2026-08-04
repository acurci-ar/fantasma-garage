"use server";

import { revalidatePath } from "next/cache";
import { categorySchema } from "@/lib/validation/admin/category";
import { createClient } from "@/lib/supabase/server";

export interface CategoryActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * ABMC de categorías de productos. Usa el cliente con sesión (no admin): la
 * RLS `categories_staff_write` ya exige is_staff(), como segunda barrera
 * además del chequeo de rol en app/admin/layout.tsx.
 */
function parseForm(formData: FormData) {
  return categorySchema.safeParse({
    slug: String(formData.get("slug") ?? ""),
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "published"),
  });
}

export async function createCategory(
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert(parsed.data);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe una categoría con ese slug." : "No pudimos crear la categoría.",
    };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/tienda");
  return { status: "success", message: "Categoría creada." };
}

export async function updateCategory(
  id: string,
  _prevState: CategoryActionState,
  formData: FormData
): Promise<CategoryActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("categories").update(parsed.data).eq("id", id);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe una categoría con ese slug." : "No pudimos actualizar la categoría.",
    };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/tienda");
  return { status: "success", message: "Categoría actualizada." };
}

export async function deleteCategory(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("categories").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar la categoría (probablemente tiene productos asociados)." };
  }

  revalidatePath("/admin/categorias");
  revalidatePath("/tienda");
  return { status: "success", message: "Categoría eliminada." };
}
