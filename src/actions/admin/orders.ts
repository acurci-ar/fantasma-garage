"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export interface OrderActionState {
  status: "idle" | "success" | "error";
  message: string;
}

const orderStatusSchema = z.object({
  status: z.enum([
    "pendiente_pago",
    "pagado",
    "preparando",
    "enviado",
    "entregado",
    "cancelado",
    "reembolsado",
  ]),
  payment_status: z.enum(["pendiente", "aprobado", "rechazado", "reembolsado"]),
  tracking_number: z.string().trim().max(120),
  internal_notes: z.string().trim().max(2000),
});

/**
 * Actualiza el estado de un pedido. Sustituto manual del webhook de
 * Mercado Pago (todavía no integrado): hasta que exista el pago automático,
 * el staff marca acá cuándo se confirmó el pago, se preparó o se envió.
 */
export async function updateOrderStatus(
  id: string,
  _prevState: OrderActionState,
  formData: FormData
): Promise<OrderActionState> {
  const parsed = orderStatusSchema.safeParse({
    status: String(formData.get("status") ?? ""),
    payment_status: String(formData.get("payment_status") ?? ""),
    tracking_number: String(formData.get("tracking_number") ?? ""),
    internal_notes: String(formData.get("internal_notes") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del formulario." };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from("orders")
    .update({
      status: parsed.data.status,
      payment_status: parsed.data.payment_status,
      tracking_number: parsed.data.tracking_number || null,
      internal_notes: parsed.data.internal_notes || null,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el pedido." };
  }

  revalidatePath("/admin/pedidos");
  revalidatePath(`/admin/pedidos/${id}`);
  revalidatePath("/admin");

  return { status: "success", message: "Pedido actualizado." };
}
