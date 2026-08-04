"use server";

import { revalidatePath } from "next/cache";
import { profileSchema, changePasswordSchema, requestPasswordResetSchema, setNewPasswordSchema } from "@/lib/validation/account";
import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, getClientIp } from "@/lib/utils/rateLimit";

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


export interface RequestPasswordResetActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

// 5 pedidos cada 10 minutos por IP (sección 7.1 — auditoría de Santiago,
// ago-2026: antes no existía este flujo, "olvidé mi contraseña" mandaba a
// /contacto). El mensaje de éxito es siempre el mismo exista o no el email
// (ver abajo): así este límite es la única señal que un atacante podría
// usar para inferir algo, y ya de por sí es floja (misma IP, no por email).
const PASSWORD_RESET_RATE_LIMIT = 5;
const PASSWORD_RESET_RATE_WINDOW_MS = 10 * 60 * 1000;

/**
 * Pide el email de recuperación de contraseña a Supabase Auth. Server
 * Action en vez de llamarlo directo desde el cliente (como hace AuthForm
 * con signIn/signUp) para poder aplicarle rate limiting por IP acá.
 *
 * Responde el mismo mensaje de éxito exista o no una cuenta con ese email:
 * si dijéramos "no encontramos esa cuenta" para emails no registrados,
 * cualquiera podría usar este formulario para averiguar qué emails están
 * registrados (enumeración de usuarios) probando uno por uno.
 */
export async function requestPasswordReset(
  _prevState: RequestPasswordResetActionState,
  formData: FormData
): Promise<RequestPasswordResetActionState> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: String(formData.get("email") ?? ""),
  });

  const successState: RequestPasswordResetActionState = {
    status: "success",
    message: "Si ese email tiene una cuenta registrada, te enviamos un link para recuperar tu contraseña.",
  };

  if (!parsed.success) {
    return {
      status: "error",
      message: "Ingresá un email válido.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  const rateLimit = checkRateLimit(`password-reset:${getClientIp()}`, PASSWORD_RESET_RATE_LIMIT, PASSWORD_RESET_RATE_WINDOW_MS);
  if (!rateLimit.allowed) {
    // Acá sí devolvemos un mensaje distinto (no hay nada que enumerar: ya
    // sabemos que se está pidiendo desde esta IP más de la cuenta, no
    // estamos confirmando si el email existe).
    return {
      status: "error",
      message: `Demasiados intentos. Probá de nuevo en ${Math.ceil(rateLimit.retryAfterSeconds / 60)} minutos.`,
    };
  }

  try {
    const supabase = await createClient();
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "";
    // Reusa /auth/callback (mismo intercambio PKCE code -> sesión que ya
    // usa la confirmación de signup) y de ahí sigue a la página donde se
    // define la nueva contraseña, ya con sesión de recuperación activa.
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${siteUrl}/auth/callback?next=${encodeURIComponent("/cuenta/nueva-contrasena")}`,
    });
  } catch (error) {
    // No exponemos el error real (podría filtrar si el email existe o no
    // según el tipo de fallo); solo lo logueamos server-side.
    console.error("[account] Error al pedir reset de contraseña:", error);
  }

  return successState;
}

export interface SetNewPasswordActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Define la nueva contraseña tras un flujo de recuperación. A diferencia
 * de changePassword, no reautentica con una contraseña actual: la sesión
 * ya viene validada por el link de recuperación (código de un solo uso,
 * de corta vida, que Supabase manda solo a la casilla dueña de la cuenta)
 * — pedir la contraseña vieja acá no sumaría seguridad real y rompería el
 * propósito del flujo (la persona está acá justamente porque no se acuerda).
 */
export async function setNewPasswordAfterRecovery(
  _prevState: SetNewPasswordActionState,
  formData: FormData
): Promise<SetNewPasswordActionState> {
  const parsed = setNewPasswordSchema.safeParse({
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

  if (!user) {
    return {
      status: "error",
      message: "El link de recuperación no es válido o ya expiró. Pedí uno nuevo desde /recuperar.",
    };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.new_password });

  if (error) {
    return { status: "error", message: "No pudimos actualizar tu contraseña. Probá de nuevo." };
  }

  return { status: "success", message: "Contraseña actualizada. Ya podés usarla para iniciar sesión." };
}
