"use server";

import { revalidatePath } from "next/cache";
import { profileSchema, changePasswordSchema } from "@/lib/validation/account";
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
    document_number: String(formData.get("document_number") ?? ""),
    shipping_street: String(formData.get("shipping_street") ?? ""),
    shipping_city: String(formData.get("shipping_city") ?? ""),
    shipping_province: String(formData.get("shipping_province") ?? ""),
    shipping_postal_code: String(formData.get("shipping_postal_code") ?? ""),
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
    .update({
      full_name: parsed.data.full_name,
      phone: parsed.data.phone || null,
      document_number: parsed.data.document_number || null,
      shipping_street: parsed.data.shipping_street || null,
      shipping_city: parsed.data.shipping_city || null,
      shipping_province: parsed.data.shipping_province || null,
      shipping_postal_code: parsed.data.shipping_postal_code || null,
    })
    .eq("id", user.id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar tu perfil." };
  }

  revalidatePath("/cuenta");
  return { status: "success", message: "Datos actualizados." };
}

export interface ChangePasswordActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Cambia la contraseña del usuario logueado (cliente o staff: no depende
 * de rol, cualquiera con sesión puede usarla — ver /cuenta y
 * /admin/configuracion).
 *
 * Antes de aplicar el cambio, reautentica con signInWithPassword usando la
 * contraseña actual: el SDK de Supabase no expone una verificación de
 * contraseña actual por separado, y updateUser() por sí solo no la exige
 * (alcanza con tener sesión activa), así que sin este paso cualquiera con
 * la sesión abierta podría cambiar la contraseña sin saber la actual.
 */
export async function changePassword(
  _prevState: ChangePasswordActionState,
  formData: FormData
): Promise<ChangePasswordActionState> {
  const parsed = changePasswordSchema.safeParse({
    current_password: String(formData.get("current_password") ?? ""),
    new_password: String(formData.get("new_password") ?? ""),
    confirm_password: String(formData.get("confirm_password") ?? ""),
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

  if (!user?.email) {
    return { status: "error", message: "Tu sesión expiró. Volvé a iniciar sesión." };
  }

  const { error: reauthError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.current_password,
  });

  if (reauthError) {
    return {
      status: "error",
      message: "La contraseña actual no es correcta.",
      fieldErrors: { current_password: ["La contraseña actual no es correcta."] },
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });

  if (error) {
    return { status: "error", message: "No pudimos actualizar tu contraseña. Probá de nuevo." };
  }

  return { status: "success", message: "Contraseña actualizada." };
}
