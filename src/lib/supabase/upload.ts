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

function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9.\-_]/g, "_").slice(-100);
}

/**
 * Sube un archivo tal cual (sin procesar con sharp) a un bucket público y
 * devuelve su URL pública. Pensado para videos propios cortos
 * (bucket 'project-videos'): a diferencia de las fotos, no tiene sentido
 * generar una miniatura acá.
 */
export async function uploadFileToBucket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  bucket: string,
  folder: string
): Promise<{ url: string } | { error: string }> {
  const path = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(arrayBuffer), { upsert: true, contentType: file.type || undefined });
  if (error) return { error: "No pudimos subir el archivo. Probá de nuevo." };

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}

/**
 * Sube un archivo a un bucket PRIVADO (ej. 'project-private') y devuelve el
 * path del objeto, no una URL pública — el bucket no tiene lectura pública,
 * así que la única forma de servir el archivo es con una signed URL
 * generada en el momento (ver getSignedFileUrl), solo para quien ya pasó
 * has_project_access() a nivel de fila.
 *
 * `folder` tiene que ser el project_id: la policy de RLS del bucket
 * (0012_project_tracking.sql) matchea has_project_access() contra el primer
 * segmento del path del objeto.
 */
export async function uploadPrivateFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  bucket: string,
  folder: string
): Promise<{ path: string } | { error: string }> {
  const path = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(arrayBuffer), { upsert: true, contentType: file.type || undefined });
  if (error) return { error: "No pudimos subir el archivo. Probá de nuevo." };

  return { path };
}

/** Ancho de la miniatura de un documento (ej. foto de una factura), bastante más chica que la de fotos de galería porque acá solo se usa como ícono/preview en una lista. */
const DOCUMENT_THUMB_WIDTH_PX = 320;

/**
 * Renderiza la primera página de un PDF a PNG con pdfjs-dist + @napi-rs/canvas
 * (ambos con binarios prearmados vía WASM/napi, sin compilar nada — pensado
 * para andar en el runtime serverless de Vercel, a diferencia de "canvas"
 * clásico que necesita Cairo/Pango instalados en el sistema). Devuelve null
 * ante cualquier error (PDF corrupto, protegido con contraseña, etc.): no es
 * crítico, el documento se guarda igual sin miniatura.
 *
 * `standardFontDataUrl` apunta a los archivos de fuentes estándar que trae
 * el propio paquete (necesarios para textos con fuentes no embebidas en el
 * PDF, algo común en facturas/remitos generados por sistemas de gestión).
 * Se resuelve con `process.cwd()` en vez de `import.meta.url`/`require.resolve`
 * porque es lo único estable tanto en dev como en una función serverless de
 * Vercel, sin importar si Next.js terminó empaquetando este módulo como
 * CJS o ESM.
 */
async function renderPdfFirstPageToPng(pdfBuffer: Buffer): Promise<Buffer | null> {
  try {
    const path = await import("node:path");
    const [{ createCanvas }, pdfjs] = await Promise.all([
      import("@napi-rs/canvas"),
      import("pdfjs-dist/legacy/build/pdf.mjs"),
    ]);

    const standardFontDataUrl = path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + path.sep;

    const loadingTask = pdfjs.getDocument({
      data: new Uint8Array(pdfBuffer),
      standardFontDataUrl,
      useSystemFonts: true,
    });
    const doc = await loadingTask.promise;
    const page = await doc.getPage(1);

    const baseViewport = page.getViewport({ scale: 1 });
    const scale = DOCUMENT_THUMB_WIDTH_PX / baseViewport.width;
    const viewport = page.getViewport({ scale });

    const canvas = createCanvas(Math.ceil(viewport.width), Math.ceil(viewport.height));
    const context = canvas.getContext("2d");
    // @napi-rs/canvas implementa la misma API de Canvas 2D que pdfjs-dist
    // espera (getContext, drawImage, etc.); el cast es porque sus tipos no
    // matchean exactamente los de lib.dom.d.ts, pero en runtime funcionan.
    // `canvas: null` porque el tipo exige la propiedad igual, aunque
    // pdfjs-dist siga soportando (a propósito, por compatibilidad) renderizar
    // solo con `canvasContext` cuando `canvas` es null.
    await page.render({
      canvas: null,
      canvasContext: context as unknown as CanvasRenderingContext2D,
      viewport,
    }).promise;

    await loadingTask.destroy();
    return canvas.toBuffer("image/png");
  } catch {
    return null;
  }
}

export interface UploadedPrivateDocument {
  path: string;
  /** null si el archivo no es una imagen, o si por algún motivo no se pudo generar la miniatura (no es un error fatal: el documento se sube igual). */
  thumbnailPath: string | null;
  mimeType: string | null;
}

/**
 * Sube un documento a un bucket PRIVADO (ej. 'project-private') y, si es una
 * imagen (la mayoría van a ser fotos de facturas), genera además una
 * miniatura liviana en WebP para mostrar como preview en la solapa
 * Documentos y en cada fila de Gastos — sin tener que bajar el archivo
 * original entero. Si no es imagen (PDF, Word, etc.) el front cae a un
 * ícono genérico según `mimeType`, no requiere miniatura.
 *
 * Igual que uploadPrivateFile: devuelve paths, no URLs públicas, porque el
 * bucket no tiene lectura pública (ver getSignedFileUrl).
 */
export async function uploadPrivateDocument(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  bucket: string,
  folder: string
): Promise<UploadedPrivateDocument | { error: string }> {
  const path = `${folder}/${Date.now()}-${sanitizeFilename(file.name)}`;
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, { upsert: true, contentType: file.type || undefined });
  if (error) return { error: "No pudimos subir el archivo. Probá de nuevo." };

  let thumbnailPath: string | null = null;
  const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

  if (file.type.startsWith("image/") || isPdf) {
    try {
      // Para PDF, primero se rasteriza la 1ª página a PNG (pdfjs-dist +
      // @napi-rs/canvas) y de ahí en más es el mismo pipeline que una
      // imagen: sharp la redimensiona/comprime a webp, consistente con el
      // resto de las miniaturas del sitio.
      const sourceBuffer = isPdf ? await renderPdfFirstPageToPng(buffer) : buffer;

      if (sourceBuffer) {
        const thumbBuffer = await sharp(sourceBuffer, { failOn: "none" })
          .rotate()
          .resize({ width: DOCUMENT_THUMB_WIDTH_PX, withoutEnlargement: true })
          .webp({ quality: 70 })
          .toBuffer();
        const candidateThumbPath = `${folder}/${Date.now()}-thumb-${sanitizeFilename(file.name)}.webp`;
        const { error: thumbError } = await supabase.storage
          .from(bucket)
          .upload(candidateThumbPath, thumbBuffer, { upsert: true, contentType: "image/webp" });
        if (!thumbError) thumbnailPath = candidateThumbPath;
      }
    } catch {
      // La miniatura es una optimización visual, no algo crítico: si falla
      // (imagen corrupta, PDF protegido con contraseña, etc.) el documento
      // se guarda igual sin ella — el front cae al ícono genérico por tipo.
    }
  }

  return { path, thumbnailPath, mimeType: file.type || null };
}

/** Signed URL de corta duración para servir un archivo de un bucket privado. Null si el objeto no existe o algo falla. */
export async function getSignedFileUrl(
  supabase: Awaited<ReturnType<typeof createClient>>,
  bucket: string,
  path: string,
  expiresInSeconds = 3600
): Promise<string | null> {
  const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, expiresInSeconds);
  if (error) return null;
  return data.signedUrl;
}
