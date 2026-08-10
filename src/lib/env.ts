// Dominio de fallback si NEXT_PUBLIC_SITE_URL no está seteado. Este valor se
// usa en layout.tsx (metadataBase, JSON-LD), robots.ts, sitemap.ts y
// llms.txt a nivel de módulo — tirar una excepción ahí tumbaría el sitio
// entero (layout.tsx es el layout raíz), así que preferimos degradar con un
// warning en vez de crashear por una variable de entorno mal cargada.
const FALLBACK_SITE_URL = "https://fantasmagarage.com";

export function getSiteUrl(): string {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (siteUrl) return siteUrl.replace(/\/$/, "");

  if (process.env.NODE_ENV === "development") {
    return "http://localhost:3000";
  }

  console.error(
    "[env] NEXT_PUBLIC_SITE_URL no está configurado. Definilo en .env.local o en la configuración del entorno. " +
      `Usando fallback: ${FALLBACK_SITE_URL}`
  );
  return FALLBACK_SITE_URL;
}

export function getResendFromEmail(): string {
  const from = process.env.RESEND_FROM_EMAIL?.trim();
  if (from) return from;

  // resend.dev es un dominio de prueba de Resend que funciona sin verificar
  // dominio propio (útil hasta que se configure RESEND_FROM_EMAIL con un
  // remitente del dominio real de Fantasma Garage).
  return "Fantasma Garage <onboarding@resend.dev>";
}
