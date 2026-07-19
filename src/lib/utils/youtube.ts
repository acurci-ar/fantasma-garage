/**
 * Extrae el ID de video de una URL de YouTube. Devuelve null para URLs de
 * canal o playlist (esos casos se enlazan directamente, sin fachada de video).
 */
export function extractYouTubeVideoId(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes("youtu.be")) {
      return parsed.pathname.replace("/", "") || null;
    }
    if (parsed.searchParams.get("v")) {
      return parsed.searchParams.get("v");
    }
    const shortsMatch = parsed.pathname.match(/\/shorts\/([^/]+)/);
    if (shortsMatch) return shortsMatch[1] ?? null;
    return null;
  } catch {
    return null;
  }
}
