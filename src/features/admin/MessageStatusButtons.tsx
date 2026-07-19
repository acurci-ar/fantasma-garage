"use client";

import { useTransition } from "react";
import { updateMessageStatus } from "@/actions/admin/messages";
import type { ContactMessageStatus } from "@/types/database";

const OPTIONS: { value: ContactMessageStatus; label: string }[] = [
  { value: "nuevo", label: "Nuevo" },
  { value: "en_proceso", label: "En proceso" },
  { value: "resuelto", label: "Resuelto" },
];

export function MessageStatusButtons({ id, current }: { id: string; current: ContactMessageStatus }) {
  const [isPending, startTransition] = useTransition();

  function handleChange(status: ContactMessageStatus) {
    startTransition(async () => {
      await updateMessageStatus(id, status);
    });
  }

  return (
    <div className="flex flex-wrap gap-2">
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          disabled={isPending || option.value === current}
          onClick={() => handleChange(option.value)}
          className="rounded-sm border border-secondary/40 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide text-foreground/70 transition-colors duration-220 hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:border-primary/60 disabled:text-primary disabled:opacity-100"
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
