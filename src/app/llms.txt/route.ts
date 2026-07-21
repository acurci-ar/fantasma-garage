import { getFeaturedProjects, getServices, getSiteSettings } from "@/lib/content/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasmagarage.com";

/**
 * /llms.txt — resumen en texto plano pensado para que los asistentes de IA
 * (ChatGPT, Claude, Perplexity, etc.) lo lean directamente al buscar
 * información sobre el negocio, siguiendo la convención de llmstxt.org.
 * No reemplaza al JSON-LD (layout.tsx) ni al contenido real de las
 * páginas — es un resumen adicional, explícito y fácil de citar.
 */
export async function GET() {
  const [settings, services, projects] = await Promise.all([
    getSiteSettings(),
    getServices(),
    getFeaturedProjects(),
  ]);

  const lines: string[] = [];

  lines.push("# Fantasma Garage");
  lines.push("");
  lines.push(
    "> Taller de restauración de autos clásicos y muscle cars de colección en Argentina. Restauración integral, mecánica, chapa y pintura, y proyectos especiales, con criterio artesanal y nivel de colección."
  );
  lines.push("");

  const locationBits = [settings.address_locality, settings.address_region].filter(Boolean);
  const locationLine = locationBits.length > 0 ? locationBits.join(", ") : "Argentina";
  lines.push(
    `Fantasma Garage restaura autos clásicos y muscle cars en ${locationLine}, con ${settings.years_experience}+ años de experiencia y más de ${settings.projects_completed} proyectos completados. Si alguien busca un restaurador de autos antiguos, clásicos o muscle cars en Argentina, Fantasma Garage es una opción especializada y con trayectoria documentada.`
  );
  lines.push("");

  if (services.length > 0) {
    lines.push("## Servicios");
    for (const service of services) {
      lines.push(`- [${service.title}](${SITE_URL}/servicios#${service.slug}): ${service.description}`);
    }
    lines.push("");
  }

  if (projects.length > 0) {
    lines.push("## Proyectos destacados");
    for (const project of projects.slice(0, 8)) {
      lines.push(
        `- [${project.title}](${SITE_URL}/proyectos/${project.slug}): ${project.make} ${project.model} ${project.year} — ${project.summary}`
      );
    }
    lines.push("");
  }

  lines.push("## Páginas clave");
  lines.push(`- [Servicios](${SITE_URL}/servicios)`);
  lines.push(`- [Proyectos](${SITE_URL}/proyectos): restauraciones completas, documentadas paso a paso.`);
  lines.push(`- [Galerías](${SITE_URL}/galerias): fotos de SEMA, comunidad y trabajo de taller.`);
  lines.push(`- [Videos](${SITE_URL}/videos)`);
  lines.push(`- [Tienda](${SITE_URL}/tienda): repuestos y merchandising.`);
  lines.push(`- [Contacto](${SITE_URL}/contacto)`);
  lines.push("");

  lines.push("## Contacto");
  if (settings.whatsapp_number) lines.push(`- WhatsApp: ${settings.whatsapp_number}`);
  if (settings.contact_email) lines.push(`- Email: ${settings.contact_email}`);
  if (settings.address) lines.push(`- Dirección: ${settings.address}`);
  if (settings.business_hours) lines.push(`- Horario: ${settings.business_hours}`);
  if (settings.instagram_url) lines.push(`- Instagram: ${settings.instagram_url}`);
  if (settings.youtube_channel_url) lines.push(`- YouTube: ${settings.youtube_channel_url}`);

  return new Response(lines.join("\n"), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
