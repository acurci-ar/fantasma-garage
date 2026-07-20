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
    // Default de Next.js es 1 MB: lo subimos para permitir subir imágenes de
    // producto desde /admin (ver ProductForm). El límite "duro" real lo
    // aplica además actions/admin/products.ts (MAX_PRODUCT_IMAGE_BYTES).
    serverActionsBodySizeLimit: "10mb",
  },
  async redirects() {
    return [];
  },
};

export default nextConfig;
