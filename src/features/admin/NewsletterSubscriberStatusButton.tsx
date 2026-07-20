"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleNewsletterSubscriberStatus } from "@/actions/admin/newsletterSubscribers";

export function NewsletterSubscriberStatusButton({ id, status }: { id: string; status: "activo" | "baja" }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const next = status === "activo" ? "baja" : "activo";

  function handleClick() {
    startTransition(async () => {
      await toggleNewsletterSubscriberStatus(id, next);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-primary transition-colors duration-220 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
    >
      {status === "activo" ? "Dar de baja" : "Reactivar"}
    </button>
  );
}
