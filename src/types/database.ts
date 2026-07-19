/**
 * Tipos de dominio que reflejan el modelo de datos definido en
 * supabase/migrations/0001_init.sql (sección 8 del documento de especificación).
 *
 * Se mantienen a mano (en vez de generados) para que el proyecto compile
 * sin necesidad de una conexión Supabase activa. Cuando el proyecto esté
 * conectado a un proyecto real, se pueden regenerar con:
 *   npx supabase gen types typescript --project-id <id> > src/types/supabase-generated.ts
 */

export type UUID = string;
export type ISODateString = string;

export type Role = "admin" | "editor" | "customer";

export interface Profile {
  id: UUID;
  full_name: string | null;
  phone: string | null;
  role: Role;
  created_at: ISODateString;
}

export type ContentStatus = "draft" | "published" | "hidden" | "discontinued";

export interface Category {
  id: UUID;
  slug: string;
  name: string;
  description: string | null;
  image_url: string | null;
  status: ContentStatus;
}

export interface Brand {
  id: UUID;
  slug: string;
  name: string;
  logo_url: string | null;
}

export interface ProductImage {
  id: UUID;
  product_id: UUID;
  url: string;
  alt: string;
  position: number;
}

export interface ProductVariant {
  id: UUID;
  product_id: UUID;
  name: string;
  value: string;
  sku: string | null;
  price_delta: number;
  stock: number;
}

export interface Product {
  id: UUID;
  slug: string;
  name: string;
  short_description: string | null;
  description: string | null;
  sku: string;
  price: number;
  sale_price: number | null;
  currency: "ARS" | "USD";
  stock: number;
  low_stock_threshold: number;
  category_id: UUID | null;
  brand_id: UUID | null;
  status: ContentStatus;
  seo_title: string | null;
  seo_description: string | null;
  images: ProductImage[];
  variants: ProductVariant[];
  category?: Category | null;
  brand?: Brand | null;
}

export type OrderStatus =
  | "pendiente_pago"
  | "pagado"
  | "preparando"
  | "enviado"
  | "entregado"
  | "cancelado"
  | "reembolsado";

export type PaymentStatus = "pendiente" | "aprobado" | "rechazado" | "reembolsado";

export interface Order {
  id: UUID;
  user_id: UUID | null;
  status: OrderStatus;
  payment_status: PaymentStatus;
  total: number;
  currency: "ARS" | "USD";
  mp_payment_id: string | null;
  mp_preference_id: string | null;
  customer_snapshot: Record<string, unknown>;
  shipping_snapshot: Record<string, unknown>;
  tracking_number: string | null;
  internal_notes: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface OrderItem {
  id: UUID;
  order_id: UUID;
  product_id: UUID;
  variant_id: UUID | null;
  product_snapshot: Record<string, unknown>;
  quantity: number;
  unit_price: number;
}

export type InventoryMovementType = "compra" | "venta" | "devolucion" | "correccion" | "reserva";

export interface InventoryMovement {
  id: UUID;
  product_id: UUID;
  variant_id: UUID | null;
  type: InventoryMovementType;
  quantity: number;
  reason: string | null;
  actor_id: UUID | null;
  created_at: ISODateString;
}

export type ProjectStatus = "en_curso" | "finalizado" | "en_pausa";

export interface ProjectImage {
  id: UUID;
  project_id: UUID;
  url: string;
  alt: string;
  stage: string | null;
  position: number;
  is_before: boolean;
  is_after: boolean;
}

export interface Project {
  id: UUID;
  slug: string;
  title: string;
  make: string;
  model: string;
  year: number;
  summary: string;
  story: string | null;
  status: ProjectStatus;
  cover_url: string;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  images: ProjectImage[];
}

export type GalleryType = "sema" | "amigos" | "trabajos";

export interface GalleryImage {
  id: UUID;
  gallery_id: UUID;
  url: string;
  alt: string;
  caption: string | null;
  position: number;
}

export interface Gallery {
  id: UUID;
  slug: string;
  title: string;
  gallery_type: GalleryType;
  description: string | null;
  cover_url: string;
  status: ContentStatus;
  published_at: ISODateString | null;
  images: GalleryImage[];
}

export type VideoSource = "playlist" | "manual";

export interface Video {
  id: UUID;
  youtube_url: string;
  title: string;
  thumbnail_url: string | null;
  featured: boolean;
  position: number;
  source: VideoSource;
}

export interface Service {
  id: UUID;
  slug: string;
  title: string;
  description: string;
  image_url: string;
  position: number;
  status: ContentStatus;
}

export interface Testimonial {
  id: UUID;
  name: string;
  story: string;
  vehicle: string | null;
  image_url: string | null;
  status: ContentStatus;
}

export type ContactMessageStatus = "nuevo" | "en_proceso" | "resuelto";

export interface ContactMessage {
  id: UUID;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  created_at: ISODateString;
}

export interface SiteSettings {
  whatsapp_number: string;
  contact_email: string;
  address: string;
  business_hours: string;
  instagram_url: string;
  youtube_channel_url: string;
  youtube_playlist_url: string;
  years_experience: number;
  projects_completed: number;
}

export interface AuditLog {
  id: UUID;
  actor_id: UUID | null;
  entity_type: string;
  entity_id: string;
  action: string;
  changes_json: Record<string, unknown>;
  created_at: ISODateString;
}
