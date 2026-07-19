import type { MetadataRoute } from "next";
import { getFeaturedProducts, getFeaturedProjects } from "@/lib/content/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasmagarage.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products] = await Promise.all([getFeaturedProjects(), getFeaturedProducts()]);

  const staticRoutes = [
    "",
    "/servicios",
    "/proyectos",
    "/galerias",
    "/galerias/sema",
    "/galerias/amigos",
    "/galerias/trabajos",
    "/videos",
    "/tienda",
    "/contacto",
    "/login",
    "/registro",
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date(),
  }));

  const projectRoutes = projects.map((p) => ({
    url: `${SITE_URL}/proyectos/${p.slug}`,
    lastModified: new Date(),
  }));

  const productRoutes = products.map((p) => ({
    url: `${SITE_URL}/tienda/${p.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...projectRoutes, ...productRoutes];
}
