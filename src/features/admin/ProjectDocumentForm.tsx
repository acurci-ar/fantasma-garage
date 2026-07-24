"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import { addProjectDocument } from "@/actions/admin/projects";
import type { ProjectDocumentActionState } from "@/actions/admin/projects";
import type { ProjectExpense } from "@/types/database";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: ProjectDocumentActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Subir documento
    </Button>
  );
}

/** Alta de documentación (siempre privada — ver project_documents_read en 0012_project_tracking.sql). */
export function ProjectDocumentForm({ projectId, expenses = [] }: { projectId: string; expenses?: ProjectExpense[] }) {
  const [state, formAction] = useFormState(addProjectDocument.bind(null, projectId), initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state.status !== "success") return;
    formRef.current?.reset();
    router.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4 rounded-sm border border-secondary/30 bg-card/40 p-4">
      <div>
        <label className={labelClasses}>Nombre</label>
        <input name="name" type="text" required placeholder="Factura taller, ficha técnica..." className={inputClasses} />
        {state.fieldErrors?.name?.length ? <p className="mt-1 text-xs text-primary">{state.fieldErrors.name[0]}</p> : null}
      </div>
      <div>
        <label className={labelClasses}>Archivo (máx. 4MB)</label>
        <input
          name="file"
          type="file"
          required
          className="block w-full text-sm text-foreground/70 file:mr-4 file:rounded-sm file:border-0 file:bg-primary file:px-4 file:py-2 file:text-xs file:font-semibold file:uppercase file:tracking-wide file:text-background hover:file:bg-primary/90"
        />
        <p className="mt-2 text-xs text-foreground/40">
          Si pesa más de 4MB, subilo a un hosting propio (Drive, etc.) y compartí el link por otro medio. Si es una
          imagen (ej. foto de una factura), se genera automáticamente una miniatura.
        </p>
      </div>
      {expenses.length > 0 && (
        <div>
          <label className={labelClasses}>Vincular a un gasto/extra (opcional)</label>
          <select name="expense_id" defaultValue="" className={inputClasses}>
            <option value="">Ninguno</option>
            {expenses.map((expense) => (
              <option key={expense.id} value={expense.id}>
                {expense.description}
              </option>
            ))}
          </select>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status !== "idle" && (
          <p className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}>{state.message}</p>
        )}
      </div>
    </form>
  );
}
