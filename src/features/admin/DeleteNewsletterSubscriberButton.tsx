"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteNewsletterSubscriber } from "@/actions/admin/newsletterSubscribers";

export function DeleteNewsletterSubscriberButton({ id }: { id: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!window.confirm("¿Eliminar este suscriptor? Esta acción no se puede deshacer.")) return;
    startTransition(async () => {
      const result = await deleteNewsletterSubscriber(id);
      if (result.status === "success") {
        router.push("/admin/newsletter");
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
      {isPending ? "Eliminando..." : "Eliminar suscriptor"}
    </button>
  );
}
