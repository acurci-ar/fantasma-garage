"use server";

import { revalidatePath } from "next/cache";
import { videoSchema } from "@/lib/validation/admin/video";
import { createClient } from "@/lib/supabase/server";

export interface VideoActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
}

/**
 * Los 3 videos destacados de la home (WorkshopVideos) vienen de acá:
 * getFeaturedVideos() en lib/content/queries.ts lee `videos` filtrando
 * featured=true. MAX_FEATURED protege ese límite server-side (además de
 * deshabilitar el botón "Destacar" en el cliente), para que no se rompa el
 * layout de 3 columnas de la home si alguien intenta destacar un cuarto.
 */
const MAX_FEATURED = 3;

function parseForm(formData: FormData) {
  return videoSchema.safeParse({
    title: String(formData.get("title") ?? ""),
    youtube_url: String(formData.get("youtube_url") ?? ""),
    featured: formData.get("featured") === "on",
    position: String(formData.get("position") ?? "0"),
  });
}

function revalidateVideoPaths() {
  revalidatePath("/admin/videos");
  revalidatePath("/");
  revalidatePath("/videos");
}

async function countFeatured(supabase: Awaited<ReturnType<typeof createClient>>): Promise<number> {
  const { count } = await supabase
    .from("videos")
    .select("id", { count: "exact", head: true })
    .eq("featured", true);
  return count ?? 0;
}

export async function createVideo(
  _prevState: VideoActionState,
  formData: FormData
): Promise<VideoActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (parsed.data.featured) {
    const current = await countFeatured(supabase);
    if (current >= MAX_FEATURED) {
      return {
        status: "error",
        message: `Ya hay ${MAX_FEATURED} videos destacados. Sacá uno de la home antes de agregar otro.`,
      };
    }
  }

  const { error } = await supabase.from("videos").insert({ ...parsed.data, source: "manual" });
  if (error) {
    return { status: "error", message: "No pudimos crear el video." };
  }

  revalidateVideoPaths();
  return { status: "success", message: "Video creado." };
}

export async function updateVideo(
  id: string,
  _prevState: VideoActionState,
  formData: FormData
): Promise<VideoActionState> {
  const parsed = parseForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const supabase = await createClient();

  if (parsed.data.featured) {
    const { data: existing } = await supabase.from("videos").select("featured").eq("id", id).single();
    if (!existing?.featured) {
      const current = await countFeatured(supabase);
      if (current >= MAX_FEATURED) {
        return {
          status: "error",
          message: `Ya hay ${MAX_FEATURED} videos destacados. Sacá uno de la home antes de agregar otro.`,
        };
      }
    }
  }

  const { error } = await supabase.from("videos").update(parsed.data).eq("id", id);
  if (error) {
    return { status: "error", message: "No pudimos actualizar el video." };
  }

  revalidateVideoPaths();
  return { status: "success", message: "Video actualizado." };
}

export async function deleteVideo(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("videos").delete().eq("id", id);

  if (error) {
    return { status: "error", message: "No pudimos eliminar el video." };
  }

  revalidateVideoPaths();
  return { status: "success", message: "Video eliminado." };
}

export async function toggleVideoFeatured(
  id: string,
  featured: boolean
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();

  if (featured) {
    const current = await countFeatured(supabase);
    if (current >= MAX_FEATURED) {
      return {
        status: "error",
        message: `Ya hay ${MAX_FEATURED} videos destacados. Sacá uno de la home antes de agregar otro.`,
      };
    }
  }

  const { error } = await supabase.from("videos").update({ featured }).eq("id", id);
  if (error) {
    return { status: "error", message: "No pudimos actualizar el video." };
  }

  revalidateVideoPaths();
  return { status: "success", message: "Video actualizado." };
}

/**
 * Destaca un video elegido desde el picker de la playlist en vivo (ver
 * PlaylistVideoPicker). Si ya existe un registro con esa URL (por ejemplo
 * quedó de una edición anterior) lo reactiva en vez de duplicarlo.
 */
export async function featureFromPlaylist(
  videoId: string,
  title: string,
  thumbnailUrl: string
): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();

  const current = await countFeatured(supabase);
  if (current >= MAX_FEATURED) {
    return {
      status: "error",
      message: `Ya hay ${MAX_FEATURED} videos destacados. Sacá uno de la home antes de agregar otro.`,
    };
  }

  const youtubeUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const { data: existing } = await supabase
    .from("videos")
    .select("id")
    .eq("youtube_url", youtubeUrl)
    .maybeSingle();

  const { error } = existing
    ? await supabase
        .from("videos")
        .update({ featured: true, title, thumbnail_url: thumbnailUrl })
        .eq("id", existing.id)
    : await supabase.from("videos").insert({
        youtube_url: youtubeUrl,
        title,
        thumbnail_url: thumbnailUrl,
        featured: true,
        position: current,
        source: "playlist",
      });

  if (error) {
    return { status: "error", message: "No pudimos destacar el video." };
  }

  revalidateVideoPaths();
  return { status: "success", message: "Video destacado." };
}
