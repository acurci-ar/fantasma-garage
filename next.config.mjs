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
  async redirects() {
    return [];
  },
};

export default nextConfig;
