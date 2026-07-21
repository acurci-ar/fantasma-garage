/**
 * Redimensiona una imagen EN EL NAVEGADOR antes de subirla, para no
 * depender de que el archivo original (una foto de celular fácil pesa
 * 5-15MB) entre en el límite de tamaño de request de una Server Action.
 * Vercel rechaza con 413 cualquier body de más de ~4.5MB en una función
 * serverless — es un límite de la plataforma, no algo que se pueda subir
 * desde next.config.mjs. La única forma confiable de evitarlo es que lo que
 * viaja por HTTP ya sea chico.
 *
 * El servidor igual vuelve a procesar la imagen con sharp (ver
 * lib/supabase/upload.ts) para generar la versión "display" definitiva y la
 * miniatura — esto solo evita mandar el archivo gigante de entrada. Si algo
 * falla acá (formato raro, navegador viejo sin soporte), se sube el
 * archivo original tal cual y que decida el servidor.
 */

const MAX_DIMENSION_PX = 2000;
const JPEG_QUALITY = 0.85;
/** Si el archivo ya es más chico que esto, no vale la pena tocarlo. */
const SKIP_RESIZE_UNDER_BYTES = 1.5 * 1024 * 1024;

export async function resizeImageForUpload(file: File): Promise<File> {
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }
  if (file.size <= SKIP_RESIZE_UNDER_BYTES) {
    return file;
  }
  if (typeof createImageBitmap !== "function" || typeof document === "undefined") {
    return file;
  }

  try {
    const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_DIMENSION_PX / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", JPEG_QUALITY));
    if (!blob || blob.size >= file.size) {
      // El achicado no ayudó (raro, pero posible con algunos PNG): mandamos el original.
      return file;
    }

    const newName = file.name.replace(/\.\w+$/, "") + ".jpg";
    return new File([blob], newName, { type: "image/jpeg", lastModified: file.lastModified });
  } catch {
    return file;
  }
}
