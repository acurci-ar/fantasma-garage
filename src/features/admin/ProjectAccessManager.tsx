"use client";

import { useEffect, useRef, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { grantProjectAccess, revokeProjectAccess } from "@/actions/admin/projects";
import type { ProjectAccessActionState } from "@/actions/admin/projects";
import type { ProjectAccess } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const initialState: ProjectAccessActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Otorgar acceso
    </Button>
  );
}

function RevokeButton({ id, projectId }: { id: string; projectId: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleRevoke() {
    if (!window.confirm("¿Quitar el acceso de este email?")) return;
    startTransition(async () => {
      const result = await revokeProjectAccess(id, projectId);
      if (result.status === "error") window.alert(result.message);
      router.refresh();
    });
  }

  return (
    <button
      type="button"
      onClick={handleRevoke}
      disabled={isPending}
      className="text-xs font-semibold uppercase tracking-wide text-red-400 transition-colors duration-220 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {isPending ? "Quitando..." : "Quitar"}
    </button>
  );
}

/**
 * Accesos otorgados por email a un proyecto privado. Se guardan aunque la
 * persona todavía no tenga cuenta: el acceso se resuelve solo apenas se
 * registra con ese mismo email (ver has_project_access en
 * 0011_project_expansion.sql).
 */
export function ProjectAccessManager({ projectId, access }: { projectId: string; access: ProjectAccess[] }) {
  const [state, formAction] = useFormState(grantProjectAccess.bind(null, projectId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <div className="space-y-4 rounded-sm border border-secondary/30 p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-foreground/60">
        Accesos (solo aplican si el proyecto es privado)
      </p>

      {access.length > 0 && (
        <ul className="space-y-2">
          {access.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center justify-between gap-3 rounded-sm bg-card/40 px-4 py-2 text-sm text-foreground/80"
            >
              <span>{entry.email}</span>
              <RevokeButton id={entry.id} projectId={projectId} />
            </li>
          ))}
        </ul>
      )}
      {access.length === 0 && <p className="text-xs text-foreground/40">Todavía no otorgaste acceso a nadie.</p>}

      <form ref={formRef} action={formAction} className="flex flex-wrap items-end gap-4">
        <div className="flex-1 min-w-[220px]">
          <label htmlFor="email" className="mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60">
            Email a invitar
          </label>
          <input id="email" name="email" type="email" required className={inputClasses} />
          {state.fieldErrors?.email?.length ? (
            <p className="mt-1 text-xs text-primary">{state.fieldErrors.email[0]}</p>
          ) : null}
        </div>
        <SubmitButton />
      </form>
      {state.status !== "idle" && !state.fieldErrors && (
        <p className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>{state.message}</p>
      )}
    </div>
  );
}
