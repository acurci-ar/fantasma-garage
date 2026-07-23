import "server-only";

const RESEND_API_KEY = process.env.RESEND_API_KEY;
// resend.dev es un dominio de prueba de Resend que funciona sin verificar
// dominio propio (útil hasta que se configure RESEND_FROM_EMAIL con un
// remitente del dominio real de Fantasma Garage).
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "Fantasma Garage <onboarding@resend.dev>";

export function isEmailConfigured(): boolean {
  return Boolean(RESEND_API_KEY);
}

export type SendEmailResult = { ok: true } | { ok: false; error: string };

/**
 * Envío de email transaccional vía la API REST de Resend (sin SDK: es un
 * solo POST, no vale la pena la dependencia extra). Si no hay
 * RESEND_API_KEY configurada, devuelve un error controlado en vez de
 * tirar una excepción — mismo criterio "modo demo" que isSupabaseConfigured()
 * en el resto del proyecto: la funcionalidad que depende de esto (responder
 * mensajes) sigue andando, solo que sin mandar el email todavía.
 */
export async function sendEmail({
  to,
  subject,
  text,
  replyTo,
}: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<SendEmailResult> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: "No hay un proveedor de email configurado (falta RESEND_API_KEY)." };
  }

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        text,
        reply_to: replyTo,
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      return { ok: false, error: `Resend respondió ${res.status}: ${body.slice(0, 300)}` };
    }

    return { ok: true };
  } catch (error) {
    return { ok: false, error: (error as Error).message };
  }
}
