"use server";

import { contactFormSchema } from "@/lib/validation/contact";
import { isSupabaseConfigured } from "@/lib/supabase/env";

export interface ContactActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Server Action del formulario de contacto (sección 5.8 / 7.5).
 * Valida con Zod, y si Supabase está configurado inserta en
 * `contact_messages`. Si no está configurado (demo local), confirma la
 * recepción sin persistir, dejando claro el estado en el mensaje.
 */
export async function submitContactForm(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const raw = {
    name: String(formData.get("name") ?? ""),
    email: String(formData.get("email") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    subject: String(formData.get("subject") ?? ""),
    message: String(formData.get("message") ?? ""),
    company: String(formData.get("company") ?? ""), // honeypot
  };

  const parsed = contactFormSchema.safeParse(raw);

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  // Honeypot: si viene completo, es un bot. Respondemos "éxito" sin persistir.
  if (parsed.data.company) {
    return { status: "success", message: "¡Gracias! Te vamos a contactar a la brevedad." };
  }

  if (!isSupabaseConfigured()) {
    console.info("[contact] Supabase no configurado. Mensaje recibido (no persistido):", parsed.data);
    return {
      status: "success",
      message:
        "¡Gracias! (Modo demo: Supabase no está configurado, así que este mensaje no se guardó).",
    };
  }

  try {
    const { createClient } = await import("@/lib/supabase/server");
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { error } = await supabase.from("contact_messages").insert({
      user_id: user?.id ?? null,
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      subject: parsed.data.subject,
      message: parsed.data.message,
      status: "nuevo",
    });
    if (error) throw error;
  } catch (error) {
    console.error("[contact] Error al guardar el mensaje:", error);
    return {
      status: "error",
      message: "No pudimos enviar tu mensaje. Probá de nuevo en unos minutos.",
    };
  }

  return { status: "success", message: "¡Gracias! Te vamos a contactar a la brevedad." };
}
