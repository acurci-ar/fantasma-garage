import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { extractPlaylistId, fetchPlaylistVideos, type PlaylistVideo } from "@/lib/youtube/playlist";
import type { Car, Category, Gallery, GalleryImage, Order, OrderItem, Product, Project, Service, SiteSettings, Testimonial, Video } from "@/types/database";
import {
  FEATURED_PRODUCTS,
  GALLERIES,
  PROJECTS,
  SERVICES,
  SITE_SETTINGS,
  TESTIMONIALS,
  VIDEOS,
} from "@/lib/content/seed-data";

/**
 * Capa de acceso a contenido para la landing pública.
 *
 * Cada función intenta leer de Supabase cuando hay credenciales
 * configuradas; si falla o no está configurado, usa los datos seed locales
 * (lib/content/seed-data.ts). Esto mantiene el sitio funcional en todo
 * momento y permite pasar a datos reales solo configurando .env.local y
 * cargando supabase/seed.sql, sin tocar los componentes visuales.
 */

async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.warn("[content] Falling back to seed data:", (error as Error).message);
    return fallback;
  }
}

export async function getServices(): Promise<Service[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("status", "published")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Service[];
  }, SERVICES);
}

/**
 * Proyectos destacados para la home (`featured = true`), ordenados por
 * `position` (arrastrable desde /admin/proyectos; por defecto el más
 * reciente primero). `limit` es solo para la home (ver page.tsx, que pide
 * 3) — sin límite trae todos los destacados.
 */
export async function getFeaturedProjects(limit?: number): Promise<Project[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    let query = supabase
      .from("projects")
      .select("*, images:project_images(*)")
      .eq("featured", true)
      .order("position", { ascending: true });
    if (limit) query = query.limit(limit);
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as Project[];
  }, limit ? PROJECTS.slice(0, limit) : PROJECTS);
}

/**
 * Todos los proyectos visibles para quien está mirando ahora — públicos +
 * los privados a los que tenga project_access (RLS `projects_public_read`
 * ya resuelve esto solo) — sin filtrar por `featured`, que solo controla
 * qué aparece en la home. Usada en /proyectos (el índice) y en
 * generateStaticParams de las fichas.
 */
export async function getVisibleProjects(): Promise<Project[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, images:project_images(*)")
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Project[];
  }, PROJECTS);
}

/**
 * Proyecto con fotos, videos y línea de tiempo, para la ficha pública
 * (/proyectos/[slug]). RLS ya filtra qué ve el visitante actual: si el
 * proyecto es privado, esta consulta solo devuelve datos si es staff o
 * tiene project_access; las fotos/videos privados quedan afuera aunque el
 * proyecto sí sea público (ver 0011/0012_project_*.sql). Documentación,
 * presupuesto, gastos y horas nunca se traen acá: son siempre privados y
 * viven solo en /admin.
 */
export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, images:project_images(*), videos:project_videos(*), stages:project_stages(*)")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    const project = data as Project;
    // Los recursos embebidos (images/videos/stages) llegan de Postgres en su
    // orden interno (básicamente el de inserción), no en el `position` que
    // el admin actualiza al arrastrar en ProjectImageManager/ProjectVideoForm
    // /ProjectStageManager — hay que ordenarlos acá a mano o la ficha pública
    // ignora el reordenamiento hecho en /admin.
    return {
      ...project,
      images: [...(project.images ?? [])].sort((a, b) => a.position - b.position),
      videos: [...(project.videos ?? [])].sort((a, b) => a.position - b.position),
      stages: (project.stages ?? []).filter((s) => s.enabled).sort((a, b) => a.position - b.position),
    };
  }, PROJECTS.find((p) => p.slug === slug) ?? null);
}

/**
 * Cantidad de fotos por página en la vista pública de una galería
 * (/galerias/[tipo]). Con hasta ~900 fotos en una sola galería, cargar todo
 * de una en un solo request/DOM inflaba la página; se trae de a tandas y el
 * resto se pide bajo demanda con el botón "Cargar más" (ver
 * GalleryLightbox + actions/gallery.ts).
 */
export const GALLERY_PAGE_SIZE = 60;

export interface GalleryDetail extends Gallery {
  /** Total de fotos publicadas en la galería (para saber si queda algo por cargar). */
  imagesTotalCount: number;
}

/** Listado de galerías (portadas). No trae las fotos de cada una: esta vista
 * solo usa cover_url/cover_thumb_url, y con galerías de cientos de fotos
 * traerlas todas acá sería puro desperdicio. */
export async function getGalleries(): Promise<Gallery[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("galleries")
      .select("*")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []).map((gallery) => ({ ...gallery, images: [] })) as Gallery[];
  }, GALLERIES);
}

/** Galería + primera página de fotos (GALLERY_PAGE_SIZE), para la vista de
 * detalle pública. El resto se trae con getGalleryImagesPage a demanda. */
export async function getGalleryByType(type: string): Promise<GalleryDetail | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data: gallery, error } = await supabase
      .from("galleries")
      .select("*")
      .eq("gallery_type", type)
      .eq("status", "published")
      .single();
    if (error) throw error;

    const { data: images, count, error: imagesError } = await supabase
      .from("gallery_images")
      .select("*", { count: "exact" })
      .eq("gallery_id", gallery.id)
      .order("position", { ascending: true })
      .range(0, GALLERY_PAGE_SIZE - 1);
    if (imagesError) throw imagesError;

    return {
      ...(gallery as Gallery),
      images: (images ?? []) as GalleryImage[],
      imagesTotalCount: count ?? images?.length ?? 0,
    };
  }, mapSeedGalleryDetail(type));
}

function mapSeedGalleryDetail(type: string): GalleryDetail | null {
  const gallery = GALLERIES.find((g) => g.gallery_type === type);
  if (!gallery) return null;
  return { ...gallery, imagesTotalCount: gallery.images.length };
}

/** Siguiente tanda de fotos de una galería, para el botón "Cargar más" de
 * GalleryLightbox. `offset` es la cantidad de fotos ya mostradas. */
export async function getGalleryImagesPage(galleryId: string, offset: number): Promise<GalleryImage[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("gallery_images")
      .select("*")
      .eq("gallery_id", galleryId)
      .order("position", { ascending: true })
      .range(offset, offset + GALLERY_PAGE_SIZE - 1);
    if (error) throw error;
    return (data ?? []) as GalleryImage[];
  } catch (error) {
    console.warn("[content] No se pudo cargar más imágenes de la galería:", (error as Error).message);
    return [];
  }
}

export async function getFeaturedVideos(): Promise<Video[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("videos")
      .select("*")
      .eq("featured", true)
      .order("position", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Video[];
  }, VIDEOS);
}

/**
 * Listado completo de la playlist del canal (sección /videos), vía YouTube
 * Data API v3. Devuelve null si no hay YOUTUBE_API_KEY configurada, la
 * playlist no se pudo resolver, o la API falló — en cualquiera de esos
 * casos /videos cae de nuevo a los destacados (getFeaturedVideos), igual
 * que el resto del sitio cuando algo no está configurado.
 */
export async function getChannelPlaylistVideos(): Promise<PlaylistVideo[] | null> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) return null;

  const settings = await getSiteSettings();
  const playlistId = extractPlaylistId(settings.youtube_playlist_url);
  if (!playlistId) return null;

  try {
    return await fetchPlaylistVideos(playlistId, apiKey);
  } catch (error) {
    console.warn("[youtube] No se pudo traer la playlist:", (error as Error).message);
    return null;
  }
}

/** Los embebidos (product_images) llegan en orden de inserción, no en el
 * `position` que se actualiza al arrastrar en /admin/productos/[id]
 * (ProductImageManager) — hay que ordenarlos acá a mano, igual que
 * getProjectBySlug con project_images. La primera foto (position más baja)
 * es la que se usa como portada en catálogo, home y ficha. */
function sortProductImages(product: Product): Product {
  return { ...product, images: [...(product.images ?? [])].sort((a, b) => a.position - b.position) };
}

/** Selección curada para la home (FeaturedShop): productos publicados marcados como `featured` desde /admin/productos. */
export async function getFeaturedProducts(): Promise<Product[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*), category:categories(*)")
      .eq("status", "published")
      .eq("featured", true)
      .order("created_at", { ascending: false })
      .limit(8);
    if (error) throw error;
    return ((data ?? []) as Product[]).map(sortProductImages);
  }, FEATURED_PRODUCTS);
}

/** Catálogo completo (sin límite) para /tienda, a diferencia del recorte de la home. */
export async function getAllProducts(): Promise<Product[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*), category:categories(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Product[]).map(sortProductImages);
  }, FEATURED_PRODUCTS);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*), category:categories(*)")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return sortProductImages(data as Product);
  }, FEATURED_PRODUCTS.find((p) => p.slug === slug) ?? null);
}

/** Categorías publicadas, para el filtro de /tienda y el selector del admin. */
export async function getCategories(): Promise<Category[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("categories").select("*").eq("status", "published").order("name", { ascending: true });
    if (error) throw error;
    return (data ?? []) as Category[];
  }, []);
}

/** Todas las categorías (incluye borrador/oculto), para el listado de /admin/categorias. */
export async function getAllCategoriesForAdmin(): Promise<Category[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("categories").select("*").order("name", { ascending: true });
  if (error) return [];
  return (data ?? []) as Category[];
}

/**
 * Autos Seleccionados visibles para quien mira ahora — la RLS
 * `cars_public_read` (0019_selected_cars.sql) ya filtra por status y por la
 * ventana published_from/published_until para un visitante sin sesión;
 * staff ve todo. Sin datos seed: si Supabase no está configurado, la
 * sección simplemente no muestra autos en vez de placeholders inventados.
 */
export async function getVisibleCars(): Promise<Car[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*, images:car_images(*)")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return ((data ?? []) as Car[]).map((car) => ({
      ...car,
      images: [...(car.images ?? [])].sort((a, b) => a.position - b.position),
    }));
  } catch (error) {
    console.warn("[content] No se pudieron cargar los autos:", (error as Error).message);
    return [];
  }
}

/** Auto por slug, con fotos y videos, para la ficha pública (/autos/[slug]). */
export async function getCarBySlug(slug: string): Promise<Car | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("cars")
      .select("*, images:car_images(*), videos:car_videos(*)")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    const car = data as Car;
    return {
      ...car,
      images: [...(car.images ?? [])].sort((a, b) => a.position - b.position),
      videos: [...(car.videos ?? [])].sort((a, b) => a.position - b.position),
    };
  } catch (error) {
    console.warn("[content] No se pudo obtener el auto:", (error as Error).message);
    return null;
  }
}

/**
 * Pedido con sus ítems, para la página de confirmación (/pedido/[id]).
 *
 * Usa el cliente admin (service role) a propósito: un pedido de invitado
 * (user_id null) no es legible por RLS para nadie sin sesión de staff (ver
 * supabase/migrations/0002_rls_policies.sql), así que esta página se apoya
 * en que el id de pedido (UUID) es prácticamente no adivinable en vez de en
 * una policy pública — el mismo criterio que usan la mayoría de las
 * pasarelas de pago para sus páginas de confirmación por link directo.
 */
export async function getOrderConfirmation(id: string): Promise<(Order & { items: OrderItem[] }) | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { data, error } = await admin
      .from("orders")
      .select("*, items:order_items(*)")
      .eq("id", id)
      .single();
    if (error) throw error;
    return data as Order & { items: OrderItem[] };
  } catch (error) {
    console.warn("[checkout] No se pudo obtener el pedido:", (error as Error).message);
    return null;
  }
}

export async function getTestimonials(): Promise<Testimonial[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("testimonials")
      .select("*")
      .eq("status", "published");
    if (error) throw error;
    return (data ?? []) as Testimonial[];
  }, TESTIMONIALS);
}

export async function getSiteSettings(): Promise<SiteSettings> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.from("site_settings").select("key, value_json");
    if (error) throw error;
    const map = Object.fromEntries((data ?? []).map((row: { key: string; value_json: unknown }) => [row.key, row.value_json]));
    return { ...SITE_SETTINGS, ...map } as SiteSettings;
  }, SITE_SETTINGS);
}
