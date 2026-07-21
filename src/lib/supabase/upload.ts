import sharp from "sharp";
import type { createClient } from "@/lib/supabase/server";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/utils/image";

/** Ancho máximo de la versión "display": la que se usa en fichas grandes, detalle y lightbox. */
const DISPLAY_MAX_WIDTH_PX = 1600;
/** Ancho de la miniatura: la que se usa en grillas/tarjetas (galerías, catálogo, listados). */
const THUMB_WIDTH_PX = 480;

export interface UploadedImage {
  url: string;
  thumbUrl: string;
}

/**
 * Sube una imagen a un bucket de Storage generando, del lado del servidor
 * con sharp, dos variantes en WebP:
 *  - "display" (máximo 1600px de ancho, calidad 82): se guarda como `url` y
 *    es la que se usa en fichas grandes, páginas de detalle y el lightbox.
 *  - "thumb" (480px de ancho, calidad 70): se guarda como `thumbUrl` y es la
 *    que hay que usar en grillas (galerías, catálogo, tarjetas de proyecto),
 *    para no obligar al navegador a bajar la foto completa donde se muestra
 *    chica.
 *
 * Se resuelve acá, en el único lugar por el que pasan todas las subidas de
 * archivo (productos, proyectos, galerías), en vez de depender de que cada
 * página use next/image con las props correctas. `rotate()` sin argumentos
 * aplica la orientación EXIF de la cámara antes de redimensionar, así las
 * fotos no quedan giradas. El límite duro de tamaño se sigue validando antes
 * de tocar el archivo.
 *
 * Nota: si la imagen no viene por archivo sino pegada como URL externa, no
 * pasa por acá y no tiene miniatura (ver las Server Actions que llaman a esta
 * función: en ese caso queda thumb_url = null y el front cae a `url`).
 */
export async function uploadImageToBucket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  bucket: string,
  folder: string
): Promise<UploadedImage | { error: string }> {
  if (!file.type.startsWith("image/")) {
    return { error: "El archivo debe ser una imagen." };
  }
  if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
    const maxMb = MAX_PRODUCT_IMAGE_BYTES / (1024 * 1024);
    const fileMb = (file.size / (1024 * 1024)).toFixed(1);
    return {
      error: `La imagen pesa ${fileMb} MB y el máximo permitido es ${maxMb} MB. Subí una versión más liviana.`,
    };
  }

  const inputBuffer = Buffer.from(await file.arrayBuffer());

  let displayBuffer: Buffer;
  let thumbBuffer: Buffer;
  try {
    const source = sharp(inputBuffer, { failOn: "none" }).rotate();
    [displayBuffer, thumbBuffer] = await Promise.all([
      source.clone().resize({ width: DISPLAY_MAX_WIDTH_PX, withoutEnlargement: true }).webp({ quality: 82 }).toBuffer(),
      source.clone().resize({ width: THUMB_WIDTH_PX, withoutEnlargement: true }).webp({ quality: 70 }).toBuffer(),
    ]);
  } catch {
    return { error: "No pudimos procesar esa imagen. Probá con otro archivo." };
  }

  const timestamp = Date.now();
  const displayPath = `${folder}/${timestamp}.webp`;
  const thumbPath = `${folder}/${timestamp}-thumb.webp`;

  const { error: displayError } = await supabase.storage
    .from(bucket)
    .upload(displayPath, displayBuffer, { upsert: true, contentType: "image/webp" });
  if (displayError) {
    return { error: "No pudimos subir la imagen. Probá de nuevo." };
  }

  const { data: displayData } = supabase.storage.from(bucket).getPublicUrl(displayPath);

  const { error: thumbError } = await supabase.storage
    .from(bucket)
    .upload(thumbPath, thumbBuffer, { upsert: true, contentType: "image/webp" });
  if (thumbError) {
    // La miniatura es una optimización, no algo crítico: si falla su subida
    // (poco probable, mismo bucket que ya funcionó recién), no rompemos todo
    // el guardado — usamos la imagen principal también como miniatura.
    return { url: displayData.publicUrl, thumbUrl: displayData.publicUrl };
  }

  const { data: thumbData } = supabase.storage.from(bucket).getPublicUrl(thumbPath);
  return { url: displayData.publicUrl, thumbUrl: thumbData.publicUrl };
}
