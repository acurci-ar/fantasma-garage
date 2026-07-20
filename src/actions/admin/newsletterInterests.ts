"use server";

import { revalidatePath } from "next/cache";
import { newsletterInterestSchema } from "@/lib/validation/admin/newsletterInterest";
import { createClient } from "@/lib/supabase/server";

export interface NewsletterInterestActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * ABMC de la lista de intereses del newsletter. Usa el cliente con sesión
 * (no admin): la RLS `newsletter_interests_staff_all` ya exige is_staff(),
 * como segunda barrera además del chequeo de rol en app/admin/layout.tsx.
 */
function parseForm(formData: FormData) {
  return newsletterInterestSchema.safeParse({
    slug: String(formData.get("slug") ?? ""),
    label: String(formData.get("label") ?? ""),
    active: formData.get("active") === "on",
    sort_order: String(formData.get("sort_order") ?? "0"),
  });
}

export async function createNewsletterInterest(
  _prevState: NewsletterInterestActionState,
  formData: FormData
): Promise<NewsletterInterestActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_interests").insert(parsed.data);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un interés con ese slug." : "No pudimos crear el interés.",
    };
  }

  revalidatePath("/admin/newsletter/intereses");
  return { status: "success", message: "Interés creado." };
}

export async function updateNewsletterInterest(
  id: string,
  _prevState: NewsletterInterestActionState,
  formData: FormData
): Promise<NewsletterInterestActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_interests").update(parsed.data).eq("id", id);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un interés con ese slug." : "No pudimos actualizar el interés.",
    };
  }

  revalidatePath("/admin/newsletter/intereses");
  return { status: "success", message: "Interés actualizado." };
}

export async function deleteNewsletterInterest(
  id: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("newsletter_interests").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el interés." };
  }

  revalidatePath("/admin/newsletter/intereses");
  return { status: "success", message: "Interés eliminado." };
}
