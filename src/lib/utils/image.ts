/**
 * Umbrales para el chequeo de "imagen pesada" del ABMC de productos
 * (src/features/admin/ProductForm.tsx). No son un límite duro del lado del
 * cliente: solo disparan una sugerencia para que el staff suba una versión
 * más liviana. El límite duro (que si rechaza) vive en
 * actions/admin/products.ts como MAX_PRODUCT_IMAGE_BYTES.
 */
export const SUGGESTED_MAX_IMAGE_BYTES = 400 * 1024; // 400 KB
export const SUGGESTED_MAX_IMAGE_DIMENSION_PX = 2000;
/**
 * 4 MB, no 8: Vercel rechaza con 413 cualquier body de más de ~4.5MB en una
 * función serverless (límite de la plataforma, no configurable desde
 * next.config.mjs). Con 8MB, un solo archivo grande ya podía superar ese
 * límite real y romper la subida con un 413 en vez del mensaje de error
 * esperado. Ver lib/utils/clientImageResize.ts: el navegador ya achica el
 * archivo antes de subirlo, así que en la práctica casi nunca se llega a
 * este tope; queda como resguardo del lado del servidor.
 */
export const MAX_PRODUCT_IMAGE_BYTES = 4 * 1024 * 1024; // 4 MB (límite duro, coordinado con lib/supabase/upload.ts)
/**
 * Tope de bytes acumulados por request de carga masiva (BulkImageUploadForm):
 * se van empaquetando archivos en un lote hasta acercarse a este número, y
 * ahí se manda ese lote y se arranca uno nuevo. Mismo motivo que
 * MAX_PRODUCT_IMAGE_BYTES: quedar cómodos bajo el límite real de Vercel.
 */
export const MAX_BULK_BATCH_BYTES = 4 * 1024 * 1024; // 4 MB por lote

/** Formatea bytes en B/KB/MB para mostrar en la UI. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/**
 * true si el archivo conviene optimizarlo antes de subirlo: pesa más de lo
 * recomendado, o sus dimensiones son mucho más grandes de lo que se va a
 * mostrar en pantalla (las fichas de producto son como máximo ~1000px).
 */
export function isImageTooHeavy(bytes: number, width?: number, height?: number): boolean {
  const heavyByBytes = bytes > SUGGESTED_MAX_IMAGE_BYTES;
  const heavyByDimensions = Boolean(
    width && height && Math.max(width, height) > SUGGESTED_MAX_IMAGE_DIMENSION_PX
  );
  return heavyByBytes || heavyByDimensions;
}

/** true si el archivo directamente se rechaza (demasiado pesado para subir). */
export function exceedsHardLimit(bytes: number): boolean {
  return bytes > MAX_PRODUCT_IMAGE_BYTES;
}
