import type { MetadataRoute } from "next";
import { getFeaturedProducts, getFeaturedProjects, getSiteSettings, getVisibleCars } from "@/lib/content/queries";
import { getVisibleTrips } from "@/lib/content/trips";
import { getSiteUrl } from "@/lib/env";

const SITE_URL = getSiteUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [projects, products, cars, trips, settings] = await Promise.all([
    getFeaturedProjects(),
    getFeaturedProducts(),
    getVisibleCars(),
    getVisibleTrips(),
    getSiteSettings(),
  ]);
  // Travesías solo entra al sitemap si la sección está activada a nivel sitio.
  const publishedTrips = settings.travesias_enabled ? trips.filter((t) => t.status === "published") : [];

  const staticRoutes = [
    "",
    "/servicios",
    "/proyectos",
    ...(publishedTrips.length > 0 ? ["/travesias"] : []),
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

  const tripRoutes = publishedTrips.map((t) => ({
    url: `${SITE_URL}/travesias/${t.slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...projectRoutes, ...productRoutes, ...carRoutes, ...tripRoutes];
}
