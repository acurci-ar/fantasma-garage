import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import type { Gallery, Order, OrderItem, Product, Project, Service, SiteSettings, Testimonial, Video } from "@/types/database";
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

export async function getFeaturedProjects(): Promise<Project[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, images:project_images(*)")
      .eq("featured", true)
      .order("year", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Project[];
  }, PROJECTS);
}

export async function getProjectBySlug(slug: string): Promise<Project | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("projects")
      .select("*, images:project_images(*)")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data as Project;
  }, PROJECTS.find((p) => p.slug === slug) ?? null);
}

export async function getGalleries(): Promise<Gallery[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("galleries")
      .select("*, images:gallery_images(*)")
      .eq("status", "published")
      .order("published_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Gallery[];
  }, GALLERIES);
}

export async function getGalleryByType(type: string): Promise<Gallery | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("galleries")
      .select("*, images:gallery_images(*)")
      .eq("gallery_type", type)
      .eq("status", "published")
      .single();
    if (error) throw error;
    return data as Gallery;
  }, GALLERIES.find((g) => g.gallery_type === type) ?? null);
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

export async function getFeaturedProducts(): Promise<Product[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("status", "published")
      .limit(4);
    if (error) throw error;
    return (data ?? []) as Product[];
  }, FEATURED_PRODUCTS);
}

/** Catálogo completo (sin límite) para /tienda, a diferencia del recorte de 4 del home. */
export async function getAllProducts(): Promise<Product[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("status", "published")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return (data ?? []) as Product[];
  }, FEATURED_PRODUCTS);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("products")
      .select("*, images:product_images(*), variants:product_variants(*)")
      .eq("slug", slug)
      .single();
    if (error) throw error;
    return data as Product;
  }, FEATURED_PRODUCTS.find((p) => p.slug === slug) ?? null);
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
