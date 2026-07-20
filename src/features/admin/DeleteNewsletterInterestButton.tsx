"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNewsletterInterest } from "@/actions/admin/newsletterInterests";

export function DeleteNewsletterInterestButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este interés? Los suscriptores que lo tenían simplemente dejan de tenerlo.")) {
      return;
    }
    startTransition(async () => {
      const result = await deleteNewsletterInterest(id);
      if (result.status === "success") {
        router.push("/admin/newsletter/intereses");
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
      {isPending ? "Eliminando..." : "Eliminar interés"}
    </button>
  );
}
