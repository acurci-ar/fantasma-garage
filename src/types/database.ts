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

export interface NewsletterInterestTag {
  id: UUID;
  slug: string;
  label: string;
  active: boolean;
  sort_order: number;
  created_at: ISODateString;
}

export interface NewsletterSubscriber {
  id: UUID;
  email: string;
  /** Slugs de newsletter_interests. Texto libre a nivel de columna (no FK);
   * se valida contra la tabla de intereses en la capa de aplicación. */
  interests: string[];
  user_id: UUID | null;
  status: "activo" | "baja";
  created_at: ISODateString;
  updated_at: ISODateString;
}

export interface Profile {
  id: UUID;
  full_name: string | null;
  /** Copia de auth.users.email (ver 0011_project_expansion.sql), usada para resolver accesos a proyectos otorgados por email. */
  email: string | null;
  phone: string | null;
  document_number: string | null;
  shipping_street: string | null;
  shipping_city: string | null;
  shipping_province: string | null;
  shipping_postal_code: string | null;
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
  /** Miniatura generada del lado del servidor al subir el archivo (ver lib/supabase/upload.ts). Null si la imagen se cargó pegando una URL. */
  thumb_url: string | null;
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

/** Público: visible para cualquiera. Privado: solo staff o accesos otorgados (ver ProjectAccess). */
export type ProjectVisibility = "public" | "private";

export interface ProjectImage {
  id: UUID;
  project_id: UUID;
  url: string;
  /** Miniatura generada del lado del servidor al subir el archivo (ver lib/supabase/upload.ts). Null si la imagen se cargó pegando una URL. */
  thumb_url: string | null;
  alt: string;
  /** Etiqueta de etapa en texto libre (legado). Preferir stage_id para asociar a un hito real de la línea de tiempo. */
  stage: string | null;
  stage_id: UUID | null;
  position: number;
  is_before: boolean;
  is_after: boolean;
  /** Si el proyecto es privado, ninguna foto se ve públicamente aunque sea 'public'. Si el proyecto es público, esta foto puntual puede seguir siendo 'private'. */
  visibility: ProjectVisibility;
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
  /** Miniatura de portada para grillas/tarjetas. Null si cover_url se cargó pegando una URL. */
  cover_thumb_url: string | null;
  featured: boolean;
  seo_title: string | null;
  seo_description: string | null;
  vin: string | null;
  engine: string | null;
  transmission: string | null;
  /** Siempre privado: solo llega al cliente cuando has_project_access() es true (ver RLS). */
  client_name: string | null;
  visibility: ProjectVisibility;
  images: ProjectImage[];
  videos?: ProjectVideo[];
  stages?: ProjectStage[];
  access?: ProjectAccess[];
  /** Solo presentes para quien tiene has_project_access() (staff o acceso otorgado) — nunca se traen en las vistas públicas. */
  documents?: ProjectDocument[];
  budget?: ProjectBudget | null;
  expenses?: ProjectExpense[];
  time_entries?: ProjectTimeEntry[];
}

export interface ProjectAccess {
  id: UUID;
  project_id: UUID;
  email: string;
  invited_by: UUID | null;
  created_at: ISODateString;
}

export type ProjectStageStatus = "pendiente" | "en_curso" | "completo";

export interface ProjectStageTemplate {
  id: UUID;
  key: string;
  name: string;
  position: number;
}

export interface ProjectStage {
  id: UUID;
  project_id: UUID;
  template_id: UUID | null;
  name: string;
  position: number;
  enabled: boolean;
  status: ProjectStageStatus;
  started_at: string | null;
  completed_at: string | null;
  notes: string | null;
  created_at: ISODateString;
}

export type ProjectVideoKind = "youtube" | "file";

export interface ProjectVideo {
  id: UUID;
  project_id: UUID;
  kind: ProjectVideoKind;
  youtube_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  visibility: ProjectVisibility;
  stage_id: UUID | null;
  position: number;
  created_at: ISODateString;
}

export interface ProjectDocument {
  id: UUID;
  project_id: UUID;
  name: string;
  /** Path del objeto en el bucket privado 'project-private', no una URL pública. Se resuelve a signed URL en el server (ver actions/admin/projects.ts). */
  file_path: string;
  /** Gasto/extra al que está asociado este documento (ej. la factura de un repuesto), si corresponde. */
  expense_id: UUID | null;
  /** Path de una miniatura (mismo bucket privado), solo si el archivo original es una imagen. */
  thumbnail_path: string | null;
  mime_type: string | null;
  uploaded_by: UUID | null;
  created_at: ISODateString;
}

export interface ProjectBudget {
  project_id: UUID;
  amount: number | null;
  currency: "ARS" | "USD";
  notes: string | null;
  updated_at: ISODateString;
}

export type ProjectExpenseKind = "gasto" | "extra";

export interface ProjectExpense {
  id: UUID;
  project_id: UUID;
  kind: ProjectExpenseKind;
  description: string;
  amount: number;
  currency: "ARS" | "USD";
  expense_date: string;
  category: string | null;
  created_by: UUID | null;
  created_at: ISODateString;
}

export interface ProjectTimeEntry {
  id: UUID;
  project_id: UUID;
  description: string | null;
  hours: number;
  entry_date: string;
  actor_id: UUID | null;
  created_at: ISODateString;
}

export type GalleryType = "sema" | "amigos" | "trabajos";

export interface GalleryImage {
  id: UUID;
  gallery_id: UUID;
  url: string;
  /** Miniatura generada del lado del servidor al subir el archivo (ver lib/supabase/upload.ts). Null si la imagen se cargó pegando una URL. */
  thumb_url: string | null;
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
  /** Miniatura de portada para grillas/tarjetas. Null si cover_url se cargó pegando una URL. */
  cover_thumb_url: string | null;
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
  user_id: UUID | null;
  name: string;
  email: string;
  phone: string | null;
  subject: string;
  message: string;
  status: ContactMessageStatus;
  /** Cuándo lo abrió el staff por primera vez; null = todavía no leído. */
  read_at: ISODateString | null;
  created_at: ISODateString;
}

export interface ContactMessageReply {
  id: UUID;
  message_id: UUID;
  author_id: UUID | null;
  body: string;
  /** false si la respuesta se guardó pero el email no se pudo enviar (o no hay proveedor configurado). */
  email_sent: boolean;
  created_at: ISODateString;
}

export interface SiteSettings {
  whatsapp_number: string;
  contact_email: string;
  /** Dirección en texto libre, para mostrar en el sitio (footer, contacto). */
  address: string;
  business_hours: string;
  instagram_url: string;
  youtube_channel_url: string;
  youtube_playlist_url: string;
  years_experience: number;
  projects_completed: number;
  /**
   * Campos estructurados adicionales para el JSON-LD (schema.org
   * LocalBusiness/AutoRepair) del layout raíz — separados de `address`
   * porque ahí necesitamos calle/localidad/provincia/CP por separado, no
   * un texto libre. Todos opcionales: si están vacíos, el layout omite esa
   * parte del JSON-LD en vez de publicar datos incompletos o inventados.
   */
  address_street: string;
  address_locality: string;
  address_region: string;
  address_postal_code: string;
  /** Código de país ISO 3166-1 alfa-2, ej. "AR". */
  address_country: string;
  /** Teléfono en formato E.164 (ej. "+5491100000000"), para el campo `telephone` del JSON-LD. */
  phone_e164: string;
  geo_lat: string;
  geo_lng: string;
  /** Rango de precio estilo Google/schema.org, ej. "$$$". */
  price_range: string;
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
