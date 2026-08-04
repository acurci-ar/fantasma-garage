import type { Metadata } from "next";
import { CategoryForm } from "@/features/admin/CategoryForm";
import { createCategory } from "@/actions/admin/categories";

export const metadata: Metadata = { title: "Nueva categoría", robots: { index: false, follow: false } };

export default function NewCategoryPage() {
  return (
    <div>
      <h1 className="font-display text-2xl uppercase tracking-tight text-foreground sm:text-3xl">
        Nueva categoría
      </h1>
      <div className="mt-8">
        <CategoryForm action={createCategory} submitLabel="Crear" />
      </div>
    </div>
  );
}
