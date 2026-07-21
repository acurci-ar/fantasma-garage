import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "@/app/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { NewsletterModalProvider } from "@/lib/newsletter/NewsletterModalContext";
import { NewsletterModal } from "@/features/home/NewsletterModal";
import { getServices, getSiteSettings } from "@/lib/content/queries";
import type { Service, SiteSettings } from "@/types/database";

const displayFont = Oswald({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-display",
  display: "swap",
});

const sansFont = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasmagarage.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fantasma Garage — Restauración de autos clásicos",
    template: "%s — Fantasma Garage",
  },
  description:
    "Atelier de restauración de autos clásicos y muscle cars de colección. Restauración integral, mecánica, chapa y pintura, y proyectos especiales.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Fantasma Garage",
    title: "Fantasma Garage — Restauración de autos clásicos",
    description:
      "Restauración, personalización y preservación de autos clásicos con criterio artesanal y nivel de colección.",
    images: [{ url: "/images/hero/hangar.webp", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Fantasma Garage — Restauración de autos clásicos",
    description: "Restauramos historia. Restauración integral de autos clásicos y muscle cars.",
  },
  icons: {
    icon: "/images/logo/fantasma-logo-800.webp",
  },
};

/**
 * JSON-LD (schema.org) del negocio, presente en todas las páginas vía el
 * layout raíz. Es la principal fuente que Google y los motores de
 * respuesta con IA (ChatGPT, Perplexity, Google AI Overviews) usan para
 * saber qué es Fantasma Garage, dónde está y cómo contactarlo.
 *
 * Los campos "estructurados" (address_*, geo_*, phone_e164, price_range)
 * vienen de /admin/configuracion y son opcionales a propósito: si todavía
 * no se cargaron, se omiten del JSON-LD en vez de publicar un dato
 * inventado o placeholder (eso es peor que no publicar nada — ver
 * discusión de "stale/incorrect structured data" en la industria de SEO).
 *
 * knowsAbout: "Chevy Fantasma" (@chevyfantasma en IG/YouTube) es la
 * especialidad insignia del taller — el Chevrolet Chevy argentino (Coupé
 * Serie 2, SS, motores 230/250) — confirmado por el dueño. Enumerarlo acá
 * ayuda a que una IA lo relacione específicamente con ese modelo, no solo
 * con "autos clásicos" en general.
 */
const KNOWS_ABOUT = [
  "Restauración de Chevrolet Chevy",
  "Chevrolet Chevy Coupé Serie 2",
  "Chevrolet Chevy SS",
  "Motor Chevrolet 230",
  "Motor Chevrolet 250",
  "Chapa artesanal y reconstrucción de paneles",
  "Restauración de autos clásicos argentinos",
  "Restauración de autos antiguos",
];

function buildLocalBusinessJsonLd(settings: SiteSettings, services: Service[]) {
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    "@id": `${SITE_URL}/#business`,
    name: "Fantasma Garage",
    alternateName: ["Chevy Fantasma"],
    description: "Atelier de restauración de autos clásicos y muscle cars de colección.",
    url: SITE_URL,
    image: `${SITE_URL}/images/hero/hangar.webp`,
    // Ciudad solo si ya se cargó en /admin/configuracion (settings.address_locality);
    // no asumimos "Buenos Aires" sin confirmar la localidad real del taller.
    areaServed: settings.address_locality
      ? [{ "@type": "City", name: settings.address_locality }, { "@type": "Country", name: "Argentina" }]
      : [{ "@type": "Country", name: "Argentina" }],
    knowsAbout: KNOWS_ABOUT,
    sameAs: [settings.instagram_url, settings.youtube_channel_url].filter(Boolean),
  };

  if (settings.contact_email) jsonLd.email = settings.contact_email;
  if (settings.phone_e164) jsonLd.telephone = settings.phone_e164;
  if (settings.price_range) jsonLd.priceRange = settings.price_range;

  if (services.length > 0) {
    jsonLd.hasOfferCatalog = {
      "@type": "OfferCatalog",
      name: "Servicios de restauración",
      itemListElement: services.map((service) => ({
        "@type": "Offer",
        itemOffered: {
          "@type": "Service",
          name: service.title,
          description: service.description,
          url: `${SITE_URL}/servicios#${service.slug}`,
        },
      })),
    };
  }

  if (settings.address_street || settings.address_locality || settings.address_region) {
    jsonLd.address = {
      "@type": "PostalAddress",
      streetAddress: settings.address_street || undefined,
      addressLocality: settings.address_locality || undefined,
      addressRegion: settings.address_region || undefined,
      postalCode: settings.address_postal_code || undefined,
      addressCountry: settings.address_country || "AR",
    };
  }

  const lat = Number(settings.geo_lat);
  const lng = Number(settings.geo_lng);
  if (settings.geo_lat && settings.geo_lng && !Number.isNaN(lat) && !Number.isNaN(lng)) {
    jsonLd.geo = { "@type": "GeoCoordinates", latitude: lat, longitude: lng };
  }

  return jsonLd;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const [settings, services] = await Promise.all([getSiteSettings(), getServices()]);
  const jsonLd = buildLocalBusinessJsonLd(settings, services);

  return (
    <html lang="es-AR" className={`${displayFont.variable} ${sansFont.variable}`}>
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <script
          type="application/ld+json"
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-[60] focus:rounded-sm focus:bg-primary focus:px-4 focus:py-2 focus:text-background"
        >
          Saltar al contenido principal
        </a>
        <CartProvider>
          <NewsletterModalProvider>
            <Navbar />
            <main id="main-content">{children}</main>
            <Footer settings={settings} />
            <CartDrawer />
            <NewsletterModal />
          </NewsletterModalProvider>
        </CartProvider>
      </body>
    </html>
  );
}
