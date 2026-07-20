"use server";

import { createClient } from "@/lib/supabase/server";
import type { NewsletterSubscriber } from "@/types/database";

/**
 * Devuelve un CSV (como texto) de los suscriptores activos que tengan al
 * menos uno de los intereses seleccionados (o todos los activos si no se
 * eligió ningún interés). Es la vía "enviar newsletter" mientras no haya un
 * proveedor de email conectado (Resend, etc.): se exporta la lista
 * filtrada y se envía manualmente desde donde ya se mandan novedades.
 *
 * Se arma el CSV en el server porque acá es donde vive el cliente
 * autenticado con permiso de leer toda la tabla (RLS
 * `newsletter_subscribers_staff_all`); el cliente solo dispara la
 * descarga con el texto que devuelve esta acción.
 */
export async function exportNewsletterSubscribers(interestSlugs: string[]): Promise<string> {
  const supabase = await createClient();
  let query = supabase.from("newsletter_subscribers").select("*").eq("status", "activo");

  if (interestSlugs.length > 0) {
    query = query.overlaps("interests", interestSlugs);
  }

  const { data } = await query.order("created_at", { ascending: false });
  const subscribers = (data ?? []) as NewsletterSubscriber[];

  const header = "email,intereses,fecha_alta";
  const rows = subscribers.map((subscriber) => {
    const email = `"${subscriber.email.replace(/"/g, '""')}"`;
    const interests = `"${subscriber.interests.join("; ")}"`;
    const date = new Date(subscriber.created_at).toISOString().slice(0, 10);
    return `${email},${interests},${date}`;
  });

  return [header, ...rows].join("\n");
}
