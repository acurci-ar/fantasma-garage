import type { MetadataRoute } from "next";
import { getFeaturedProducts, getFeaturedProjects, getVisibleCars } from "@/lib/content/queries";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasmagarage.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products, cars] = await Promise.all([getFeaturedProjects(), getFeaturedProducts(), getVisibleCars()]);

  const staticRoutes = [
    "",
    "/servicios",
    "/proyectos",
    "/autos",
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

  const carRoutes = cars.map((c) => ({
    url: `${SITE_URL}/autos/${c.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...projectRoutes, ...productRoutes, ...carRoutes];
}
