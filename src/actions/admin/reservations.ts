"use server";

import { revalidatePath } from "next/cache";
import { reservationSchema, paymentSchema } from "@/lib/validation/admin/reservation";
import { createClient } from "@/lib/supabase/server";

export interface ReservationActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  id?: string;
}

function revalidateReservationPaths(id?: string) {
  revalidatePath("/admin/reservas");
  revalidatePath("/admin"); // KPI del dashboard
  revalidatePath("/cuenta"); // el cliente ve su reserva
  if (id) {
    revalidatePath(`/admin/reservas/${id}`);
    revalidatePath(`/cuenta/reservas/${id}`);
  }
}

function parseReservation(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "");
  return reservationSchema.safeParse({
    trip_id: str("trip_id"),
    full_name: str("full_name"),
    email: str("email"),
    phone: str("phone"),
    participants: str("participants"),
    with_copilot: formData.get("with_copilot") === "on",
    car_preference: str("car_preference"),
    status: str("status") || "solicitada",
    currency: str("currency") || "USD",
    total_amount: str("total_amount") || "0",
    options: str("options"),
    public_notes: str("public_notes"),
    admin_notes: str("admin_notes"),
  });
}

// El cliente ve su reserva por coincidencia de email (RLS
// trip_reservations_select_own: lower(email) = email de la sesión), así que
// no hace falta resolver user_id a mano: alcanza con cargar bien el email.

export async function createReservation(_prev: ReservationActionState, formData: FormData): Promise<ReservationActionState> {
  const parsed = parseReservation(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trip_reservations")
    .insert({ ...parsed.data, phone: parsed.data.phone || null, car_preference: parsed.data.car_preference || null })
    .select("id")
    .single();
  if (error) {
    return { status: "error", message: "No pudimos crear la reserva." };
  }
  revalidateReservationPaths(data.id);
  return { status: "success", message: "Reserva creada.", id: data.id };
}

export async function updateReservation(id: string, _prev: ReservationActionState, formData: FormData): Promise<ReservationActionState> {
  const parsed = parseReservation(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { error } = await supabase
    .from("trip_reservations")
    .update({ ...parsed.data, phone: parsed.data.phone || null, car_preference: parsed.data.car_preference || null })
    .eq("id", id);
  if (error) {
    return { status: "error", message: "No pudimos actualizar la reserva." };
  }
  revalidateReservationPaths(id);
  return { status: "success", message: "Reserva actualizada." };
}

export async function updateReservationStatus(
  id: string,
  statusValue: string
): Promise<{ status: "success" | "error"; message: string }> {
  const valid = ["solicitada", "lista_espera", "confirmada", "senada", "pagada", "cancelada"];
  if (!valid.includes(statusValue)) return { status: "error", message: "Estado inválido." };
  const supabase = await createClient();
  const { error } = await supabase.from("trip_reservations").update({ status: statusValue }).eq("id", id);
  if (error) return { status: "error", message: "No pudimos cambiar el estado." };
  revalidateReservationPaths(id);
  return { status: "success", message: "Estado actualizado." };
}

export async function deleteReservation(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("trip_reservations").delete().eq("id", id);
  if (error) return { status: "error", message: "No pudimos eliminar la reserva." };
  revalidateReservationPaths();
  return { status: "success", message: "Reserva eliminada." };
}

// ---------------------------------------------------------------- pagos

export async function addPayment(reservationId: string, _prev: ReservationActionState, formData: FormData): Promise<ReservationActionState> {
  const str = (k: string) => String(formData.get(k) ?? "");
  const parsed = paymentSchema.safeParse({
    amount: str("amount"),
    currency: str("currency") || "USD",
    method: str("method") || "transferencia",
    paid_at: str("paid_at"),
    reference: str("reference"),
    note: str("note"),
  });
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del pago.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await supabase.from("trip_payments").insert({
    reservation_id: reservationId,
    amount: parsed.data.amount,
    currency: parsed.data.currency,
    method: parsed.data.method,
    paid_at: parsed.data.paid_at,
    reference: parsed.data.reference || null,
    note: parsed.data.note || null,
    created_by: user?.id ?? null,
  });
  if (error) {
    return { status: "error", message: "No pudimos registrar el pago." };
  }
  revalidateReservationPaths(reservationId);
  return { status: "success", message: "Pago registrado." };
}

export async function deletePayment(
  reservationId: string,
  paymentId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("trip_payments").delete().eq("id", paymentId).eq("reservation_id", reservationId);
  if (error) return { status: "error", message: "No pudimos eliminar el pago." };
  revalidateReservationPaths(reservationId);
  return { status: "success", message: "Pago eliminado." };
}
