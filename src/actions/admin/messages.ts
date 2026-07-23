"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email/resend";
import { contactReplySchema } from "@/lib/validation/admin/contactReply";
import { getSiteSettings } from "@/lib/content/queries";
import type { ContactMessage, ContactMessageStatus } from "@/types/database";

export async function updateMessageStatus(
  id: string,
  status: ContactMessageStatus
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("contact_messages").update({ status }).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el mensaje." };
  }

  revalidatePath("/admin/mensajes");
  revalidatePath("/admin");
  return { status: "success", message: "Mensaje actualizado." };
}

export interface ContactReplyActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Responde un mensaje de contacto: guarda la respuesta en
 * contact_message_replies (queda visible para el cliente en /cuenta) y la
 * manda por email a message.email vía Resend. Si el email falla o no hay
 * proveedor configurado, la respuesta se guarda igual — no perdemos el
 * trabajo del staff por un problema de envío — pero el mensaje de retorno
 * lo deja en claro para que avisen al cliente por otro medio.
 */
export async function replyToContactMessage(
  messageId: string,
  _prevState: ContactReplyActionState,
  formData: FormData
): Promise<ContactReplyActionState> {
  const parsed = contactReplySchema.safeParse({ body: String(formData.get("body") ?? "") });
  if (!parsed.success) {
    return { status: "error", message: "Revisá la respuesta.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  const { data: original, error: fetchError } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("id", messageId)
    .single();

  if (fetchError || !original) {
    return { status: "error", message: "No encontramos el mensaje original." };
  }
  const message = original as ContactMessage;

  const [{ data: userData }, settings] = await Promise.all([supabase.auth.getUser(), getSiteSettings()]);

  const emailText = [
    `Hola ${message.name},`,
    "",
    parsed.data.body,
    "",
    "—",
    "Fantasma Garage",
    "",
    "Mensaje original:",
    `"${message.message}"`,
  ].join("\n");

  const sendResult = await sendEmail({
    to: message.email,
    subject: `Re: ${message.subject}`,
    text: emailText,
    replyTo: settings.contact_email || undefined,
  });

  const { error: insertError } = await supabase.from("contact_message_replies").insert({
    message_id: messageId,
    author_id: userData.user?.id ?? null,
    body: parsed.data.body,
    email_sent: sendResult.ok,
  });

  if (insertError) {
    return { status: "error", message: "No pudimos guardar la respuesta." };
  }

  if (message.status === "nuevo") {
    await supabase.from("contact_messages").update({ status: "en_proceso" }).eq("id", messageId);
  }

  revalidatePath("/admin/mensajes");
  revalidatePath(`/admin/mensajes/${messageId}`);
  revalidatePath("/cuenta");

  if (!sendResult.ok) {
    return {
      status: "success",
      message: `Respuesta guardada, pero no pudimos enviarle el email (${sendResult.error}). Contactá al cliente por otro medio.`,
    };
  }

  return { status: "success", message: "Respuesta guardada y enviada por email." };
}
