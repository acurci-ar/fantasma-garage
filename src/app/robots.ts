import type { MetadataRoute } from "next";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://fantasmagarage.com";

// Rastreadores de motores de respuesta con IA (ChatGPT, Claude, Perplexity,
// Google AI Overviews, Apple Intelligence). Ya quedaban permitidos por la
// regla "*" de abajo, pero los listamos explícitamente: varias guías de GEO
// recomiendan un allow explícito por bot en vez de depender solo del
// comodín, para que quede claro que la intención es dejarlos pasar.
const AI_CRAWLERS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "Claude-Web",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "CCBot",
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/cuenta", "/carrito"],
      },
      {
        userAgent: AI_CRAWLERS,
        allow: "/",
        disallow: ["/admin", "/cuenta", "/carrito"],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
