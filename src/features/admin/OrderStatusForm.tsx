"use client";

import { useFormState, useFormStatus } from "react-dom";
import { Button } from "@/components/ui/Button";
import type { Order } from "@/types/database";
import { updateOrderStatus, type OrderActionState } from "@/actions/admin/orders";

const inputClasses =
  "w-full rounded-sm border border-secondary/50 bg-background/60 px-4 py-3 text-sm text-foreground placeholder:text-foreground/35 transition-colors duration-220 focus:border-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-primary";

const labelClasses = "mb-2 block text-xs font-semibold uppercase tracking-wide text-foreground/60";

const initialState: OrderActionState = { status: "idle", message: "" };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" loading={pending}>
      Guardar cambios
    </Button>
  );
}

export function OrderStatusForm({ order }: { order: Order }) {
  const [state, formAction] = useFormState(updateOrderStatus.bind(null, order.id), initialState);

  return (
    <form action={formAction} className="space-y-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div>
          <label htmlFor="status" className={labelClasses}>
            Estado del pedido
          </label>
          <select id="status" name="status" defaultValue={order.status} className={inputClasses}>
            <option value="pendiente_pago">Pendiente de pago</option>
            <option value="pagado">Pagado</option>
            <option value="preparando">Preparando</option>
            <option value="enviado">Enviado</option>
            <option value="entregado">Entregado</option>
            <option value="cancelado">Cancelado</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
        </div>
        <div>
          <label htmlFor="payment_status" className={labelClasses}>
            Estado del pago
          </label>
          <select id="payment_status" name="payment_status" defaultValue={order.payment_status} className={inputClasses}>
            <option value="pendiente">Pendiente</option>
            <option value="aprobado">Aprobado</option>
            <option value="rechazado">Rechazado</option>
            <option value="reembolsado">Reembolsado</option>
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="tracking_number" className={labelClasses}>
          Número de seguimiento (opcional)
        </label>
        <input
          id="tracking_number"
          name="tracking_number"
          type="text"
          defaultValue={order.tracking_number ?? ""}
          className={inputClasses}
        />
      </div>

      <div>
        <label htmlFor="internal_notes" className={labelClasses}>
          Notas internas (no las ve el cliente)
        </label>
        <textarea
          id="internal_notes"
          name="internal_notes"
          rows={3}
          defaultValue={order.internal_notes ?? ""}
          className={inputClasses}
        />
      </div>

      <div className="flex flex-wrap items-center gap-4">
        <SubmitButton />
        {state.status !== "idle" && (
          <p
            role="status"
            aria-live="polite"
            className={state.status === "success" ? "text-sm text-primary" : "text-sm text-red-400"}
          >
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
