import type { Metadata } from "next";
import { Oswald, Inter } from "next/font/google";
import "@/app/globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { CartProvider } from "@/lib/cart/CartContext";
import { CartDrawer } from "@/components/cart/CartDrawer";
import { getSiteSettings } from "@/lib/content/queries";

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

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSiteSettings();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "AutoRepair",
    name: "Fantasma Garage",
    description:
      "Atelier de restauración de autos clásicos y muscle cars de colección.",
    url: SITE_URL,
    email: settings.contact_email,
    address: settings.address,
    sameAs: [settings.instagram_url, settings.youtube_channel_url],
  };

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
          <Navbar />
          <main id="main-content">{children}</main>
          <Footer settings={settings} />
          <CartDrawer />
        </CartProvider>
      </body>
    </html>
  );
}
