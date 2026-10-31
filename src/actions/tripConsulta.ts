"use server";

import { tripConsultaSchema } from "@/lib/validation/tripConsulta";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { checkRateLimit, getClientIp } from "@/lib/utils/rateLimit";
import type { TripOptional } from "@/types/trips";

export interface TripConsultaActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// Igual que el formulario de contacto: 5 consultas cada 10 minutos por IP.
const RATE_LIMIT = 5;
const RATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Llamado a la acción de una travesía. NO crea una reserva: arma una
 * consulta con todo lo que cargó la persona (participantes, copiloto, auto
 * preferido, opcionales de interés) y la guarda en contact_messages, para
 * que aparezca en la bandeja Mensajes del admin. Desde ahí el staff crea la
 * reserva en /admin/reservas. Reaprovecha el insert público de
 * contact_messages (misma política que submitContactForm).
 */
export async function requestTripConsulta(
  _prevState: TripConsultaActionState,
  formData: FormData
): Promise<TripConsultaActionState> {
  const parsed = tripConsultaSchema.safeParse({
    trip_id: String(formData.get("trip_id") ?? ""),
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    participants: String(formData.get("participants") ?? "1"),
    with_copilot: formData.get("with_copilot") === "on",
    car_preference: String(formData.get("car_preference") ?? ""),
    options: formData.getAll("options").map(String),
    message: String(formData.get("message") ?? ""),
    company: String(formData.get("company") ?? ""),
  });

  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del formulario.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Honeypot: respondemos "éxito" sin persistir.
  if (parsed.data.company) {
    return { status: "success", message: "¡Recibimos tu consulta! Te contactamos a la brevedad." };
  }

  const rateLimit = checkRateLimit(`trip-consulta:${getClientIp()}`, RATE_LIMIT, RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    return {
      status: "error",
      message: `Recibimos varias consultas tuyas en poco tiempo. Probá de nuevo en ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.`,
    };
  }

  const d = parsed.data;

  if (!isSupabaseConfigured()) {
    console.info("[trip-consulta] Supabase no configurado. Consulta recibida (no persistida):", d);
    return {
      status: "success",
      message: "¡Recibimos tu consulta! (Modo demo: Supabase no está configurado, así que no se guardó).",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { data: trip } = await supabase
      .from("trips")
      .select("title, optionals, status")
      .eq("id", d.trip_id)
      .maybeSingle();

    const tripTitle = (trip?.title as string) ?? "Travesía";
    const tripOptionals = (Array.isArray(trip?.optionals) ? trip?.optionals : []) as TripOptional[];
    const chosen = d.options
      .map((label) => tripOptionals.find((o) => o.label === label)?.label)
      .filter((l): l is string => Boolean(l));

    // Toda la info estructurada va al cuerpo del mensaje, así el staff la
    // tiene a mano cuando arma la reserva en /admin/reservas.
    const body = [
      `Consulta de reserva — ${tripTitle}`,
      `Participantes: ${d.participants}`,
      `Copiloto: ${d.with_copilot ? "sí" : "no"}`,
      d.car_preference ? `Auto preferido: ${d.car_preference}` : null,
      chosen.length ? `Opcionales de interés: ${chosen.join(", ")}` : null,
      d.message ? `\nMensaje:\n${d.message}` : null,
    ]
      .filter(Boolean)
      .join("\n");

    const { error } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null,
      name: d.name,
      email: d.email,
      phone: d.phone || null,
      subject: `Consulta Travesía: ${tripTitle}`,
      message: body,
      status: "nuevo",
    });
    if (error) throw error;
  } catch (error) {
    console.error("[trip-consulta] Error al guardar la consulta:", error);
    return { status: "error", message: "No pudimos registrar tu consulta. Probá de nuevo en unos minutos." };
  }

  return {
    status: "success",
    message: "¡Recibimos tu consulta! Te contactamos en las próximas 48 horas para confirmar disponibilidad y precio.",
  };
}
