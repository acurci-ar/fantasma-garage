"use client";

import { useMemo, useState, useTransition } from "react";
import { exportNewsletterSubscribers } from "@/actions/admin/newsletterExport";
import { Button } from "@/components/ui/Button";
import type { NewsletterInterestTag, NewsletterSubscriber } from "@/types/database";

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Filtro por intereses + exportación a CSV. Reemplaza el envío automático
 * mientras no haya un proveedor de email conectado: la lista filtrada se
 * descarga y se manda manualmente desde donde ya se mandan novedades.
 */
export function NewsletterExportPanel({
  interests,
  subscribers,
}: {
  interests: NewsletterInterestTag[];
  subscribers: NewsletterSubscriber[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const matchCount = useMemo(() => {
    if (selected.size === 0) return subscribers.filter((s) => s.status === "activo").length;
    return subscribers.filter((s) => s.status === "activo" && s.interests.some((i) => selected.has(i))).length;
  }, [selected, subscribers]);

  function toggle(slug: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  function handleExport() {
    startTransition(async () => {
      const csv = await exportNewsletterSubscribers(Array.from(selected));
      const suffix = selected.size > 0 ? Array.from(selected).join("-") : "todos";
      downloadCsv(csv, `newsletter-${suffix}.csv`);
    });
  }

  return (
    <div className="max-w-lg space-y-6">
      {interests.length > 0 ? (
        <fieldset>
          <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Filtrar por interés (dejá todo sin marcar para incluir a todos los activos)
          </legend>
          <div className="grid grid-cols-2 gap-2">
            {interests.map((interest) => (
              <label key={interest.id} className="flex items-center gap-2 text-sm text-foreground/70">
                <input
                  type="checkbox"
                  checked={selected.has(interest.slug)}
                  onChange={() => toggle(interest.slug)}
                  className="h-4 w-4 rounded-sm border-secondary/50 bg-background/60 text-primary focus:ring-primary"
                />
                {interest.label}
              </label>
            ))}
          </div>
        </fieldset>
      ) : (
        <p className="text-sm text-foreground/50">
          Todavía no hay intereses cargados, así que el filtro incluye a todos los suscriptores activos.
        </p>
      )}

      <div className="rounded-sm border border-secondary/30 bg-card/40 p-4 text-sm text-foreground/70">
        <span className="font-display text-lg text-primary">{matchCount}</span> suscriptor(es) activo(s)
        coinciden con el filtro actual.
      </div>

      <Button type="button" onClick={handleExport} loading={isPending} disabled={matchCount === 0}>
        Exportar CSV
      </Button>
    </div>
  );
}
