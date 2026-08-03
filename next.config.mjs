/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
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
  async redirects() {
    return [];
  },
};

export default nextConfig;
