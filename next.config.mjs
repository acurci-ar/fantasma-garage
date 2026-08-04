/** @type {import('next').NextConfig} */

// Cabeceras de seguridad aplicadas a toda respuesta (sección 7.1 —
// hallazgo de la auditoría de Santiago, ago-2026). No usamos un
// Content-Security-Policy basado en nonces: el App Router de Next 14
// inyecta sus propios <script> inline para hidratar (self.__next_f.push),
// y sin nonce eso requiere 'unsafe-inline' en script-src igual — hacerlo
// "bien" con nonces exige generar uno por request en el middleware y
// propagarlo a next/script, que es un cambio más grande y no está libre
// de riesgo (Next tuvo un CVE de XSS específico en su implementación de
// nonces: GHSA-ffhc-5mcf-pf4q). Preferimos una CSP más simple que igual
// cierra la superficie que más importa — exfiltración a dominios externos,
// framing, tipos MIME sniffeados — y dejamos la variante con nonces para
// cuando migremos a Next 15 (donde además se resuelve ese CVE).
const CSP = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https://*.supabase.co https://i.ytimg.com",
  "font-src 'self' data:",
  "connect-src 'self' https://*.supabase.co",
  "frame-src https://www.youtube-nocookie.com",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  "upgrade-insecure-requests",
].join("; ");

const SECURITY_HEADERS = [
  { key: "Content-Security-Policy", value: CSP },
  // Redundante con frame-ancestors de la CSP de arriba, pero lo dejamos
  // para navegadores viejos que no soportan frame-ancestors.
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
  },
];

const nextConfig = {
  reactStrictMode: true,
  // No anunciar el framework en cada respuesta (fingerprinting trivial del
  // stack para apuntar CVEs conocidas de Next — hallazgo de la auditoría).
  poweredByHeader: false,
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "**.supabase.co" },
      { protocol: "https", hostname: "i.ytimg.com" },
    ],
    formats: ["image/avif", "image/webp"],
  },
  experimental: {
    // Vercel rechaza con 413 cualquier body de más de ~4.5MB en una función
    // serverless: es un límite de la plataforma que este valor no puede
    // superar (poner "10mb" acá no sirve de nada si Vercel igual corta
    // antes en 4.5MB, como pasó al subir muchas fotos juntas). Se deja en
    // 4.5mb, coordinado con MAX_PRODUCT_IMAGE_BYTES y MAX_BULK_BATCH_BYTES
    // (lib/utils/image.ts) que ya apuntan a quedar por debajo de ese tope.
    serverActions: {
      bodySizeLimit: "4.5mb",
    },
    // @napi-rs/canvas trae un binario nativo (.node) por plataforma. Si
    // webpack intenta empaquetarlo (incluso detrás de un `import()` dinámico
    // con literal, como en renderPdfFirstPageToPng) falla al no saber
    // parsear ese archivo ("Module parse failed: Unexpected character").
    // Al marcarlo (junto con pdfjs-dist) como paquete externo, Next lo deja
    // afuera del bundle y lo resuelve con require() de Node en runtime, que
    // sí sabe cargar binarios nativos — el file tracer de Vercel igual lo
    // detecta y lo suma a la función serverless.
    serverComponentsExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],
    // La miniatura de PDF (uploadPrivateDocument, lib/supabase/upload.ts)
    // usa pdfjs-dist, que además de código lee archivos de fuentes propios
    // en tiempo de ejecución (standard_fonts/*) con un path armado a mano
    // (process.cwd()) — el file tracer de Vercel no los detecta solo
    // siguiendo imports estáticos, así que hay que pedírselo explícito o la
    // función serverless queda sin esos archivos en producción.
    outputFileTracingIncludes: {
      "/admin/**": [
        "./node_modules/pdfjs-dist/standard_fonts/**",
        "./node_modules/pdfjs-dist/cmaps/**",
        "./node_modules/@napi-rs/canvas-linux-x64-gnu/**",
      ],
    },
  },
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
