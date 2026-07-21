"use server";

import { revalidatePath } from "next/cache";
import { gallerySchema, galleryImageSchema } from "@/lib/validation/admin/gallery";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket } from "@/lib/supabase/upload";

export interface GalleryActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Edición de las 3 galerías (SEMA / Amigos / Trabajos). No hay alta ni baja
 * acá a propósito: gallery_type es un enum fijo de 3 valores y las páginas
 * públicas (getGalleryByType) asumen una sola fila por tipo — crear otra
 * rompería esa asunción. Lo que sí es ABMC completo es gallery_images
 * dentro de cada una (abajo).
 */
function parseGalleryForm(formData: FormData) {
  return gallerySchema.safeParse({
    title: String(formData.get("title") ?? ""),
    description: String(formData.get("description") ?? ""),
    status: String(formData.get("status") ?? "draft"),
    cover_url: String(formData.get("cover_url") ?? ""),
  });
}

export async function updateGallery(
  id: string,
  slug: string,
  _prevState: GalleryActionState,
  formData: FormData
): Promise<GalleryActionState> {
  const parsed = parseGalleryForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { cover_url, ...galleryData } = parsed.data;

  let finalCoverUrl = cover_url;
  const coverFile = formData.get("cover_file");
  if (coverFile instanceof File && coverFile.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, coverFile, "gallery-images", slug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalCoverUrl = uploaded.url;
  }

  if (!finalCoverUrl) {
    return { status: "error", message: "Subí una foto de portada o pegá una URL." };
  }

  const { error } = await supabase
    .from("galleries")
    .update({ ...galleryData, cover_url: finalCoverUrl })
    .eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar la galería." };
  }

  revalidatePath("/admin/galerias");
  revalidatePath(`/admin/galerias/${id}`);
  revalidatePath("/galerias");
  revalidatePath(`/galerias/${slug}`);
  revalidatePath("/");
  return { status: "success", message: "Galería actualizada." };
}

// ---------------------------------------------------------------------------
// Fotos de cada galería
// ---------------------------------------------------------------------------

export interface GalleryImageActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

function parseGalleryImageForm(formData: FormData) {
  return galleryImageSchema.safeParse({
    url: String(formData.get("url") ?? ""),
    alt: String(formData.get("alt") ?? ""),
    caption: String(formData.get("caption") ?? ""),
    position: String(formData.get("position") ?? "0"),
  });
}

export async function addGalleryImage(
  galleryId: string,
  gallerySlug: string,
  _prevState: GalleryImageActionState,
  formData: FormData
): Promise<GalleryImageActionState> {
  const parsed = parseGalleryImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, ...imageData } = parsed.data;

  let finalUrl = url;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "gallery-images", gallerySlug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
  }

  if (!finalUrl) {
    return { status: "error", message: "Subí una imagen o pegá una URL." };
  }

  const { error } = await supabase
    .from("gallery_images")
    .insert({ ...imageData, url: finalUrl, gallery_id: galleryId });

  if (error) {
    return { status: "error", message: "No pudimos agregar la imagen." };
  }

  revalidatePath(`/admin/galerias/${galleryId}`);
  revalidatePath(`/galerias/${gallerySlug}`);
  return { status: "success", message: "Imagen agregada." };
}

export async function updateGalleryImage(
  id: string,
  galleryId: string,
  gallerySlug: string,
  _prevState: GalleryImageActionState,
  formData: FormData
): Promise<GalleryImageActionState> {
  const parsed = parseGalleryImageForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();
  const { url, ...imageData } = parsed.data;

  let finalUrl = url;
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, "gallery-images", gallerySlug);
    if ("error" in uploaded) return { status: "error", message: uploaded.error };
    finalUrl = uploaded.url;
  }

  const update: Record<string, unknown> = { ...imageData };
  if (finalUrl) update.url = finalUrl;

  const { error } = await supabase.from("gallery_images").update(update).eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos actualizar la imagen." };
  }

  revalidatePath(`/admin/galerias/${galleryId}`);
  revalidatePath(`/galerias/${gallerySlug}`);
  return { status: "success", message: "Imagen actualizada." };
}

export async function deleteGalleryImage(
  id: string,
  galleryId: string,
  gallerySlug: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("gallery_images").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar la imagen." };
  }

  revalidatePath(`/admin/galerias/${galleryId}`);
  revalidatePath(`/galerias/${gallerySlug}`);
  return { status: "success", message: "Imagen eliminada." };
}
