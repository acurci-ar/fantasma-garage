"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { ContactMessageStatus } from "@/types/database";

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
