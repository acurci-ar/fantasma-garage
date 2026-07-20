"use server";

import { revalidatePath } from "next/cache";
import { profileSchema } from "@/lib/validation/account";
import { createClient } from "@/lib/supabase/server";

export interface ProfileActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Actualiza el perfil del usuario logueado. Usa el cliente con sesión (no
 * admin): la RLS `profiles_update_own` ya exige auth.uid() = id, así que
 * ni hace falta pasar el id acá — Supabase lo resuelve solo contra el
 * usuario autenticado.
 */
export async function updateProfile(
  _prevState: ProfileActionState,
  formData: FormData
): Promise<ProfileActionState> {
  const parsed = profileSchema.safeParse({
    full_name: String(formData.get("full_name") ?? ""),
    phone: String(formData.get("phone") ?? ""),
  });

  if (!parsed.success) {
    return {
      status: "error",
      message: "Revisá los datos del formulario.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { status: "error", message: "Tu sesión expiró. Volvé a iniciar sesión." };
  }

  const { error } = await supabase
    .from("profiles")
    .update({ full_name: parsed.data.full_name, phone: parsed.data.phone || null })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar tu perfil." };
  }

  revalidatePath("/cuenta");
  return { status: "success", message: "Datos actualizados." };
}
