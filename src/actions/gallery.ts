"use server";

import { getGalleryImagesPage } from "@/lib/content/queries";
import type { GalleryImage } from "@/types/database";

/**
 * Server action pública que trae la siguiente tanda de fotos de una
 * galería. Se le pasa directamente a GalleryLightbox (client component)
 * para el botón "Cargar más" — ver src/features/home/GalleryLightbox.tsx.
 */
export async function loadMoreGalleryImages(galleryId: string, offset: number): Promise<GalleryImage[]> {
  return getGalleryImagesPage(galleryId, offset);
}
