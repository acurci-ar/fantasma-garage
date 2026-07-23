/**
 * Límite para clips de video propios subidos como archivo (bucket
 * 'project-videos'). Mismo tope de 4MB que imágenes/documentos por el
 * límite real de Vercel para el body de una función serverless — alcanza
 * para clips muy cortos. Para videos más pesados, lo esperable es pegar un
 * link de YouTube o de un hosting propio (kind='youtube' o pegar la URL en
 * vez de subir el archivo).
 */
export const MAX_VIDEO_FILE_BYTES = 4 * 1024 * 1024; // 4 MB

export function exceedsVideoFileLimit(bytes: number): boolean {
  return bytes > MAX_VIDEO_FILE_BYTES;
}
