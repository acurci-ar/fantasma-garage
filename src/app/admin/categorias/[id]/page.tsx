import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CategoryForm } from "@/features/admin/CategoryForm";
import { DeleteCategoryButton } from "@/features/admin/DeleteCategoryButton";
import { updateCategory } from "@/actions/admin/categories";
import type { Category } from "@/types/database";

export const metadata: Metadata = { title: "Editar categoría", robots: { index: false, follow: false } };

export default async function EditCategoryPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const { createClient } = await import("@/lib/supabase/server");
  const supabase = await createClient();
  const { data: category } = await supabase.from("categories").select("*").eq("id", id).single();

  if (!category) notFound();

  const typedCategory = category as Category;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
          {typedCategory.name}
        </h1>
        <DeleteCategoryButton id={id} />
      </div>
      <div className="mt-8">
        <CategoryForm action={updateCategory.bind(null, id)} category={typedCategory} submitLabel="Guardar cambios" />
      </div>
    </div>
  );
}
