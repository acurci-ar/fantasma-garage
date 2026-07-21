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
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
