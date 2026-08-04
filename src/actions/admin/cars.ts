"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { carSchema, carImageSchema, carVideoSchema } from "@/lib/validation/admin/car";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket, uploadFileToBucket } from "@/lib/supabase/upload";

export interface CarActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * ABMC de Autos Seleccionados (/admin/autos). Usa el cliente con sesión (no
 * admin): la RLS `cars_staff_write` ya exige is_staff(), como segunda
 * barrera además del chequeo de rol en app/admin/layout.tsx — mismo criterio
 * que products.ts/projects.ts.
 */
function parseCarForm(formData: FormData) {
  const raw = {
    title: String(formData.get("title") ?? ""),
    slug: String(formData.get("slug") ?? ""),
    make: String(formData.get("make") ?? ""),
    model: String(formData.get("model") ?? ""),
    year: String(formData.get("year") ?? ""),
    price: String(formData.get("price") ?? ""),
    currency: String(formData.get("currency") ?? "USD"),
    mileage_km: String(formData.get("mileage_km") ?? ""),
    engine: String(formData.get("engine") ?? ""),
    transmission: String(formData.get("transmission") ?? ""),
    color: String(formData.get("color") ?? ""),
    summary: String(formData.get("summary") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    published_from: String(formData.get("published_from") ?? ""),
    published_until: String(formData.get("published_until") ?? ""),
    cover_url: String(formData.get("cover_url") ?? ""),
    seo_title: String(formData.get("seo_title") ?? ""),
    seo_description: String(formData.get("seo_description") ?? ""),
  };
  return carSchema.safeParse(raw);
}

export async function createCar(_prevState: CarActionState, formData: FormData): Promise<CarActionState> {
  const parsed = parseCarForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del formulario.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { cover_url, ...carData } = parsed.data;

  let finalCoverUrl = cover_url;
  let finalCoverThumbUrl: string | null = null;
  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, coverFile, "car-images", carData.slug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalCoverUrl = uploaded.url;
    finalCoverThumbUrl = uploaded.thumbUrl;
  }

  if (!finalCoverUrl) {
    return { status: "error", message: "Subí una foto de portada o pegá una URL." };
  }

  const { data: car, error } = await supabase
    .from("cars")
    .insert({ ...carData, cover_url: finalCoverUrl, cover_thumb_url: finalCoverThumbUrl })
    .select("id")
    .single();

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un auto con ese slug." : "No pudimos crear el auto.",
    };
  }

  revalidatePath("/admin/autos");
  revalidatePath("/autos");
  redirect(`/admin/autos/${car.id}`);
}

export async function updateCar(
  id: string,
  _prevState: CarActionState,
  formData: FormData
): Promise<CarActionState> {
  const parsed = parseCarForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del formulario.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { cover_url, ...carData } = parsed.data;

  const { data: existingCar } = await supabase.from("cars").select("cover_url, cover_thumb_url").eq("id", id).maybeSingle();

  let finalCoverUrl = cover_url;
  let finalCoverThumbUrl: string | null =
    existingCar?.cover_url === cover_url ? existingCar?.cover_thumb_url ?? null : null;

  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, coverFile, "car-images", carData.slug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalCoverUrl = uploaded.url;
    finalCoverThumbUrl = uploaded.thumbUrl;
  }

  if (!finalCoverUrl) {
    return { status: "error", message: "Subí una foto de portada o pegá una URL." };
  }

  const { error } = await supabase
    .from("cars")
    .update({ ...carData, cover_url: finalCoverUrl, cover_thumb_url: finalCoverThumbUrl })
    .eq("id", id);

  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Ya existe un auto con ese slug." : "No pudimos actualizar el auto.",
    };
  }

  revalidatePath("/admin/autos");
  revalidatePath(`/admin/autos/${id}`);
  revalidatePath("/autos");
  revalidatePath(`/autos/${carData.slug}`);
  return { status: "success", message: "Auto actualizado." };
}

export async function deleteCar(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("cars").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el auto." };
  }

  revalidatePath("/admin/autos");
  revalidatePath("/autos");
  return { status: "success", message: "Auto eliminado." };
}

// ---------------------------------------------------------------------------
// Fotos (car_images) — mismo patrón que ProductImageManager/ProjectImageManager.
// ---------------------------------------------------------------------------

export interface CarImageActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

function parseCarImageForm(formData: FormData) {
  return carImageSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    alt: String(formData.get("alt") ?? ""),
  });
}

export async function addCarImage(
  carId: string,
  _prevState: CarImageActionState,
  formData: FormData
): Promise<CarImageActionState> {
  const parsed = parseCarImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, ...imageData } = parsed.data;

  let finalUrl = url;
  let finalThumbUrl: string | null = null;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "car-images", carId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
    finalThumbUrl = uploaded.thumbUrl;
  }

  if (!finalUrl) {
    return { status: "error", message: "Subí una imagen o pegá una URL." };
  }

  const { data: lastImage } = await supabase
    .from("car_images")
    .select("position")
    .eq("car_id", carId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("car_images").insert({
    ...imageData,
    position: (lastImage?.position ?? -1) + 1,
    url: finalUrl,
    thumb_url: finalThumbUrl,
    car_id: carId,
  });

  if (error) {
    return { status: "error", message: "No pudimos agregar la imagen." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Imagen agregada." };
}

export async function updateCarImage(
  id: string,
  carId: string,
  _prevState: CarImageActionState,
  formData: FormData
): Promise<CarImageActionState> {
  const parsed = parseCarImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, ...imageData } = parsed.data;

  const { data: existingImage } = await supabase.from("car_images").select("url, thumb_url").eq("id", id).maybeSingle();

  let finalUrl = url;
  let finalThumbUrl: string | null = existingImage?.url === url ? existingImage?.thumb_url ?? null : null;

  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "car-images", carId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
    finalThumbUrl = uploaded.thumbUrl;
  }

  const update: Record<string, unknown> = { ...imageData, thumb_url: finalThumbUrl };
  if (finalUrl) update.url = finalUrl;

  const { error } = await supabase.from("car_images").update(update).eq("id", id);
  if (error) {
    return { status: "error", message: "No pudimos actualizar la imagen." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Imagen actualizada." };
}

export async function deleteCarImage(
  id: string,
  carId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("car_images").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar la imagen." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Imagen eliminada." };
}

/** Persiste el orden de arrastre de las fotos: recibe los ids en el orden final y les asigna position 0..n-1. */
export async function reorderCarImages(
  carId: string,
  orderedIds: string[]
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("car_images").update({ position: index }).eq("id", id))
  );
  const error = results.find((r) => r.error)?.error;

  if (error) {
    return { status: "error", message: "No pudimos guardar el nuevo orden." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Orden guardado." };
}

// ---------------------------------------------------------------------------
// Videos (car_videos) — mismo patrón que ProjectVideoForm/Row, simplificado
// (sin hito de línea de tiempo ni visibilidad, los autos no tienen eso).
// ---------------------------------------------------------------------------

export interface CarVideoActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

function parseCarVideoForm(formData: FormData) {
  return carVideoSchema.safeParse({
    kind: String(formData.get("kind") ?? "youtube"),
    youtube_url: String(formData.get("youtube_url") ?? ""),
    video_url: String(formData.get("video_url") ?? ""),
  });
}

export async function addCarVideo(
  carId: string,
  _prevState: CarVideoActionState,
  formData: FormData
): Promise<CarVideoActionState> {
  const parsed = parseCarVideoForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del video.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { video_url, ...videoData } = parsed.data;

  let finalVideoUrl = video_url || null;
  const file = formData.get("file");
  if (videoData.kind === "file" && file instanceof File && file.size > 0) {
    const { exceedsVideoFileLimit, MAX_VIDEO_FILE_BYTES } = await import("@/lib/utils/video");
    if (exceedsVideoFileLimit(file.size)) {
      return {
        status: "error",
        message: `El archivo pesa más de ${Math.round(MAX_VIDEO_FILE_BYTES / (1024 * 1024))}MB. Para clips más pesados, pegá un link de YouTube o de un hosting propio.`,
      };
    }
    const uploaded = await uploadFileToBucket(supabase, file, "car-videos", carId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalVideoUrl = uploaded.url;
  }

  if (videoData.kind === "file" && !finalVideoUrl) {
    return { status: "error", message: "Subí un archivo de video o pegá una URL." };
  }

  const { data: lastVideo } = await supabase
    .from("car_videos")
    .select("position")
    .eq("car_id", carId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { error } = await supabase.from("car_videos").insert({
    ...videoData,
    youtube_url: videoData.kind === "youtube" ? videoData.youtube_url || null : null,
    video_url: videoData.kind === "file" ? finalVideoUrl : null,
    position: (lastVideo?.position ?? -1) + 1,
    car_id: carId,
  });

  if (error) {
    return { status: "error", message: "No pudimos agregar el video." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Video agregado." };
}

export async function updateCarVideo(
  id: string,
  carId: string,
  _prevState: CarVideoActionState,
  formData: FormData
): Promise<CarVideoActionState> {
  const parsed = parseCarVideoForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos del video.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { video_url, ...videoData } = parsed.data;

  let finalVideoUrl = video_url || null;
  const file = formData.get("file");
  if (videoData.kind === "file" && file instanceof File && file.size > 0) {
    const { exceedsVideoFileLimit, MAX_VIDEO_FILE_BYTES } = await import("@/lib/utils/video");
    if (exceedsVideoFileLimit(file.size)) {
      return {
        status: "error",
        message: `El archivo pesa más de ${Math.round(MAX_VIDEO_FILE_BYTES / (1024 * 1024))}MB. Para clips más pesados, pegá un link de YouTube o de un hosting propio.`,
      };
    }
    const uploaded = await uploadFileToBucket(supabase, file, "car-videos", carId);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalVideoUrl = uploaded.url;
  }

  const { error } = await supabase
    .from("car_videos")
    .update({
      ...videoData,
      youtube_url: videoData.kind === "youtube" ? videoData.youtube_url || null : null,
      video_url: videoData.kind === "file" ? finalVideoUrl : null,
    })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar el video." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Video actualizado." };
}

export async function deleteCarVideo(
  id: string,
  carId: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("car_videos").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el video." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Video eliminado." };
}

/** Persiste el orden de arrastre de los videos: recibe los ids en el orden final y les asigna position 0..n-1. */
export async function reorderCarVideos(
  carId: string,
  orderedIds: string[]
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();

  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("car_videos").update({ position: index }).eq("id", id))
  );
  const error = results.find((r) => r.error)?.error;

  if (error) {
    return { status: "error", message: "No pudimos guardar el nuevo orden." };
  }

  revalidatePath(`/admin/autos/${carId}`);
  revalidatePath("/autos");
  return { status: "success", message: "Orden guardado." };
}
