/**
 * Umbrales para el chequeo de "imagen pesada" del ABMC de productos
 * (src/features/admin/ProductForm.tsx). No son un límite duro del lado del
 * cliente: solo disparan una sugerencia para que el staff suba una versión
 * más liviana. El límite duro (que si rechaza) vive en
 * actions/admin/products.ts como MAX_PRODUCT_IMAGE_BYTES.
 */
export const SUGGESTED_MAX_IMAGE_BYTES = 400 * 1024; // 400 KB
export const SUGGESTED_MAX_IMAGE_DIMENSION_PX = 2000;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024; // 8 MB (límite duro, coordinado con actions/admin/products.ts)

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
