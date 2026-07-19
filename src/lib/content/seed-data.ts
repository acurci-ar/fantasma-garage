/**
 * DATOS DE DEMOSTRACIÓN — no son información real de negocio.
 *
 * Se usan como fallback cuando Supabase no está configurado (ver
 * lib/supabase/env.ts) y como base de referencia para supabase/seed.sql.
 * Todo el contenido textual y numérico aquí es ilustrativo y debe
 * reemplazarse desde el panel de administración en producción.
 */
import type {
  Gallery,
  Product,
  Project,
  Service,
  SiteSettings,
  Testimonial,
  Video,
} from "@/types/database";

export const SITE_SETTINGS: SiteSettings = {
  whatsapp_number: "+54 9 11 0000-0000",
  contact_email: "contacto@fantasmagarage.com",
  address: "Buenos Aires, Argentina (dirección exacta a definir)",
  business_hours: "Lunes a viernes, 9 a 18 h",
  instagram_url: "https://www.instagram.com/chevyfantasma",
  youtube_channel_url: "https://www.youtube.com/@ChevyFantasma",
  youtube_playlist_url: "https://www.youtube.com/playlist?list=PL-Li2_2OPYlhQhe5zjqz-qdf2miu3Hdsz",
  years_experience: 15,
  projects_completed: 80,
};

export const SERVICES: Service[] = [
  {
    id: "svc-1",
    slug: "restauracion-integral",
    title: "Restauración integral",
    description:
      "Recuperamos el vehículo completo, de chasis a terminación, con criterio de preservación histórica y nivel de colección.",
    image_url: "/images/galeria/trabajos.webp",
    position: 1,
    status: "published",
  },
  {
    id: "svc-2",
    slug: "mecanica",
    title: "Mecánica",
    description:
      "Puesta a punto, reconstrucción de motor y tren delantero/trasero, con repuestos originales o de calidad equivalente.",
    image_url: "/images/galeria/mecanica.webp",
    position: 2,
    status: "published",
  },
  {
    id: "svc-3",
    slug: "chapa-y-pintura",
    title: "Chapa y pintura",
    description:
      "Trabajo artesanal de chapa, alineación de paneles y pintura con acabados de exhibición.",
    image_url: "/images/galeria/chapa.webp",
    position: 3,
    status: "published",
  },
  {
    id: "svc-4",
    slug: "repuestos",
    title: "Repuestos",
    description:
      "Búsqueda, importación y fabricación de piezas difíciles de conseguir para modelos clásicos y muscle cars.",
    image_url: "/images/productos/motor.webp",
    position: 4,
    status: "published",
  },
  {
    id: "svc-5",
    slug: "proyectos-especiales",
    title: "Proyectos especiales",
    description:
      "Restomods y personalizaciones a medida, manteniendo el carácter original del vehículo.",
    image_url: "/images/galeria/detalles.webp",
    position: 5,
    status: "published",
  },
];

export const PROCESS_STEPS = [
  { key: "diagnostico", title: "Diagnóstico", description: "Relevamiento completo del estado del vehículo y plan de trabajo." },
  { key: "desarme", title: "Desarme", description: "Desarme total documentado, pieza por pieza." },
  { key: "chapa", title: "Chapa", description: "Corrección de estructura y paneles, imagen: /images/galeria/chapa.webp" },
  { key: "mecanica", title: "Mecánica", description: "Reconstrucción de motor, caja y tren rodante, imagen: /images/galeria/mecanica.webp" },
  { key: "pintura", title: "Pintura", description: "Preparación de superficie y pintura de acabado premium." },
  { key: "armado", title: "Armado", description: "Ensamblado final, detalles y puesta a punto." },
  { key: "entrega", title: "Entrega", description: "Control de calidad y entrega documentada al propietario." },
] as const;

export const PROJECTS: Project[] = [
  {
    id: "prj-1",
    slug: "chevy-camaro-1969",
    title: "Chevy Camaro 1969",
    make: "Chevrolet",
    model: "Camaro",
    year: 1969,
    summary: "Restauración integral de un Camaro SS con reconstrucción completa de motor y chapa.",
    story:
      "Proyecto de demostración. Llegó con más de treinta años de inactividad; se restauró preservando la identidad original de fábrica.",
    status: "finalizado",
    cover_url: "/images/galeria/trabajos.webp",
    featured: true,
    seo_title: null,
    seo_description: null,
    images: [],
  },
  {
    id: "prj-2",
    slug: "chevy-nova-1972",
    title: "Chevy Nova 1972",
    make: "Chevrolet",
    model: "Nova",
    year: 1972,
    summary: "Puesta a punto mecánica completa y chapa/pintura con acabado de exhibición.",
    story: "Proyecto de demostración en curso, documentado como referencia del proceso Fantasma Garage.",
    status: "en_curso",
    cover_url: "/images/galeria/mecanica.webp",
    featured: true,
    seo_title: null,
    seo_description: null,
    images: [],
  },
  {
    id: "prj-3",
    slug: "dodge-charger-1970",
    title: "Dodge Charger 1970",
    make: "Dodge",
    model: "Charger",
    year: 1970,
    summary: "Restomod conservando líneas originales, con mejoras de suspensión y frenos.",
    story: "Proyecto de demostración. Ejemplo de restomod con criterio conservador.",
    status: "finalizado",
    cover_url: "/images/galeria/detalles.webp",
    featured: true,
    seo_title: null,
    seo_description: null,
    images: [],
  },
];

export const GALLERIES: Gallery[] = [
  {
    id: "gal-sema",
    slug: "sema",
    title: "SEMA",
    gallery_type: "sema",
    description: "Cobertura de exhibiciones, tendencias y vehículos del SEMA Show.",
    cover_url: "/images/galeria/detalles.webp",
    status: "published",
    published_at: null,
    images: [],
  },
  {
    id: "gal-amigos",
    slug: "amigos",
    title: "Amigos",
    gallery_type: "amigos",
    description: "Comunidad, encuentros y cultura alrededor de los clásicos.",
    cover_url: "/images/galeria/mecanica.webp",
    status: "published",
    published_at: null,
    images: [],
  },
  {
    id: "gal-trabajos",
    slug: "trabajos",
    title: "Trabajos",
    gallery_type: "trabajos",
    description: "Procesos, detalles y resultados de Fantasma Garage.",
    cover_url: "/images/galeria/chapa.webp",
    status: "published",
    published_at: null,
    images: [],
  },
];

export const VIDEOS: Video[] = [
  {
    id: "vid-1",
    youtube_url: "https://www.youtube.com/@ChevyFantasma",
    title: "Dentro del taller — episodio destacado",
    thumbnail_url: null,
    featured: true,
    position: 1,
    source: "manual",
  },
  {
    id: "vid-2",
    youtube_url: "https://www.youtube.com/playlist?list=PL-Li2_2OPYlhQhe5zjqz-qdf2miu3Hdsz",
    title: "Playlist completa del canal",
    thumbnail_url: null,
    featured: true,
    position: 2,
    source: "playlist",
  },
];

export const TESTIMONIALS: Testimonial[] = [
  {
    id: "test-1",
    name: "Cliente de demostración",
    story:
      "Testimonio de ejemplo — reemplazar por casos reales desde /admin antes de publicar en producción.",
    vehicle: "Chevrolet Camaro 1969",
    image_url: null,
    status: "published",
  },
];

export const FEATURED_PRODUCTS: Product[] = [
  {
    id: "prod-1",
    slug: "kit-suspension-clasica",
    name: "Kit de suspensión clásica",
    short_description: "Kit de suspensión de alto rendimiento para muscle cars.",
    description:
      "Producto de demostración. Reemplazar por catálogo real desde /admin.",
    sku: "FG-SUSP-001",
    price: 450000,
    sale_price: null,
    currency: "ARS",
    stock: 6,
    low_stock_threshold: 2,
    category_id: null,
    brand_id: null,
    status: "published",
    seo_title: null,
    seo_description: null,
    images: [
      { id: "img-1", product_id: "prod-1", url: "/images/productos/suspension.webp", alt: "Kit de suspensión clásica", position: 1 },
    ],
    variants: [],
  },
  {
    id: "prod-2",
    slug: "motor-reconstruido-v8",
    name: "Motor V8 reconstruido",
    short_description: "Motor V8 reconstruido a nuevo, listo para instalar.",
    description:
      "Producto de demostración. Reemplazar por catálogo real desde /admin.",
    sku: "FG-MOTOR-001",
    price: 3200000,
    sale_price: null,
    currency: "ARS",
    stock: 1,
    low_stock_threshold: 1,
    category_id: null,
    brand_id: null,
    status: "published",
    seo_title: null,
    seo_description: null,
    images: [
      { id: "img-2", product_id: "prod-2", url: "/images/productos/motor.webp", alt: "Motor V8 reconstruido", position: 1 },
    ],
    variants: [],
  },
];
