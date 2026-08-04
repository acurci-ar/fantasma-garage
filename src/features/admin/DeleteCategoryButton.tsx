"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteCategory } from "@/actions/admin/categories";

export function DeleteCategoryButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar esta categoría?")) return;
    startTransition(async () => {
      const result = await deleteCategory(id);
      if (result.status === "success") {
        router.push("/admin/categorias");
        router.refresh();
      } else {
        window.alert(result.message);
      }
    });
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Eliminando..." : "Eliminar categoría"}
    </button>
  );
}
