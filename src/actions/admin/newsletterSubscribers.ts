"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newsletterSubscriberSchema } from "@/lib/validation/admin/newsletterSubscriber";
import { createClient } from "@/lib/supabase/server";

export interface NewsletterSubscriberActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * ABMC de suscriptores desde el admin. Usa el cliente con sesión (no
 * admin): la RLS `newsletter_subscribers_staff_all` ya exige is_staff(),
 * como segunda barrera además del chequeo de rol en app/admin/layout.tsx.
 */
function parseForm(formData: FormData) {
  return newsletterSubscriberSchema.safeParse({
    email: String(formData.get("email") ?? ""),
    interests: formData.getAll("interests").map(String),
    status: String(formData.get("status") ?? "activo"),
  });
}

export async function createNewsletterSubscriber(
  _prevState: NewsletterSubscriberActionState,
  formData: FormData
): Promise<NewsletterSubscriberActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("newsletter_subscribers")
    .insert(parsed.data)
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un suscriptor con ese email." : "No pudimos crear el suscriptor.",
    };
  }

  revalidatePath("/admin/newsletter");
  redirect(`/admin/newsletter/${data.id}`);
}

export async function updateNewsletterSubscriber(
  id: string,
  _prevState: NewsletterSubscriberActionState,
  formData: FormData
): Promise<NewsletterSubscriberActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").update(parsed.data).eq("id", id);

  if (error) {
    return {
      status: "error",
      message:
        error.code === "23505" ? "Ya existe un suscriptor con ese email." : "No pudimos actualizar el suscriptor.",
    };
  }

  revalidatePath("/admin/newsletter");
  revalidatePath(`/admin/newsletter/${id}`);
  return { status: "success", message: "Suscriptor actualizado." };
}

export async function deleteNewsletterSubscriber(
  id: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el suscriptor." };
  }

  revalidatePath("/admin/newsletter");
  return { status: "success", message: "Suscriptor eliminado." };
}

export async function toggleNewsletterSubscriberStatus(
  id: string,
  status: "activo" | "baja"
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_subscribers").update({ status }).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el estado." };
  }

  revalidatePath("/admin/newsletter");
  return { status: "success", message: "Estado actualizado." };
}
