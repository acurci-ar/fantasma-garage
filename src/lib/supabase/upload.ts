import type { createClient } from "@/lib/supabase/server";
import { MAX_PRODUCT_IMAGE_BYTES } from "@/lib/utils/image";

/**
 * Sube un archivo de imagen a un bucket de Storage y devuelve su URL
 * pública. Compartido entre productos, proyectos y galerías: misma
 * validación de tipo/tamaño (el límite duro que si rechaza; el "sugerido"
 * que solo avisa vive en el cliente, ver lib/utils/image.ts) y mismo
 * esquema de path (carpeta/timestamp.ext).
 */
export async function uploadImageToBucket(
  supabase: Awaited<ReturnType<typeof createClient>>,
  file: File,
  bucket: string,
  folder: string
): Promise<{ url: string } | { error: string }> {
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

  const extension = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const path = `${folder}/${Date.now()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(bucket)
    .upload(path, file, { upsert: true, contentType: file.type || "image/jpeg" });

  if (uploadError) {
    return { error: "No pudimos subir la imagen. Probá de nuevo." };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return { url: data.publicUrl };
}
