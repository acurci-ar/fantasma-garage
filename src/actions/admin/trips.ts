"use server";

import { revalidatePath } from "next/cache";
import { tripSchema, tripDaySchema } from "@/lib/validation/admin/trip";
import { createClient } from "@/lib/supabase/server";
import { uploadImageToBucket } from "@/lib/supabase/upload";

export interface TripActionState {
  status: "idle" | "success" | "error";
  message: string;
  fieldErrors?: Record<string, string[]>;
  /** Id de la travesía recién creada (para redirigir a su edición). */
  id?: string;
}

const BUCKET = "trip-images";

function revalidateTripPaths(slug?: string) {
  revalidatePath("/", "layout"); // la sección Travesías (home + menú) depende del sitio y del estado publicado
  revalidatePath("/travesias");
  if (slug) revalidatePath(`/travesias/${slug}`);
  revalidatePath("/admin/travesias");
}

function parseTripForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "");
  return tripSchema.safeParse({
    title: str("title"),
    slug: str("slug"),
    subtitle: str("subtitle"),
    eyebrow: str("eyebrow"),
    summary: str("summary"),
    description: str("description"),
    status: str("status") || "draft",
    show_price: formData.get("show_price") === "on",
    position: str("position"),
    start_date: str("start_date"),
    end_date: str("end_date"),
    duration_label: str("duration_label"),
    price: str("price"),
    currency: str("currency") || "USD",
    price_note: str("price_note"),
    min_participants: str("min_participants"),
    max_participants: str("max_participants"),
    cover_url: str("cover_url"),
    cover_credit: str("cover_credit"),
    cta_label: str("cta_label"),
    cta_url: str("cta_url"),
    highlights: str("highlights"),
    includes: str("includes"),
    excludes: str("excludes"),
    optionals: str("optionals"),
    seo_title: str("seo_title"),
    seo_description: str("seo_description"),
  });
}

async function resolveImage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  formData: FormData,
  fileField: string,
  urlValue: string,
  folder: string
): Promise<{ url: string; thumbUrl: string | null } | { error: string }> {
  const file = formData.get(fileField);
  if (file instanceof File && file.size > 0) {
    const uploaded = await uploadImageToBucket(supabase, file, BUCKET, folder);
    if ("error" in uploaded) return uploaded;
    return { url: uploaded.url, thumbUrl: uploaded.thumbUrl };
  }
  return { url: urlValue, thumbUrl: null };
}

export async function createTrip(_prev: TripActionState, formData: FormData): Promise<TripActionState> {
  const parsed = parseTripForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const cover = await resolveImage(supabase, formData, "cover_file", parsed.data.cover_url, parsed.data.slug);
  if ("error" in cover) return { status: "error", message: cover.error };
  if (!cover.url) return { status: "error", message: "La travesía necesita una imagen de portada.", fieldErrors: { cover_url: ["Subí un archivo o pegá una URL."] } };

  const { data, error } = await supabase
    .from("trips")
    .insert({ ...parsed.data, cover_url: cover.url, cover_thumb_url: cover.thumbUrl })
    .select("id")
    .single();
  if (error) {
    const dup = error.code === "23505";
    return { status: "error", message: dup ? "Ya existe una travesía con ese slug." : "No pudimos crear la travesía." };
  }
  revalidateTripPaths(parsed.data.slug);
  return { status: "success", message: "Travesía creada. Ahora cargá los días del itinerario.", id: data.id };
}

export async function updateTrip(id: string, _prev: TripActionState, formData: FormData): Promise<TripActionState> {
  const parsed = parseTripForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase.from("trips").select("slug, cover_url, cover_thumb_url").eq("id", id).maybeSingle();

  const cover = await resolveImage(supabase, formData, "cover_file", parsed.data.cover_url, parsed.data.slug);
  if ("error" in cover) return { status: "error", message: cover.error };
  if (!cover.url) return { status: "error", message: "La travesía necesita una imagen de portada." };
  const thumb = cover.thumbUrl ?? (existing?.cover_url === cover.url ? existing?.cover_thumb_url ?? null : null);

  const { error } = await supabase
    .from("trips")
    .update({ ...parsed.data, cover_url: cover.url, cover_thumb_url: thumb })
    .eq("id", id);
  if (error) {
    const dup = error.code === "23505";
    return { status: "error", message: dup ? "Ya existe una travesía con ese slug." : "No pudimos actualizar la travesía." };
  }
  revalidateTripPaths(parsed.data.slug);
  if (existing?.slug && existing.slug !== parsed.data.slug) revalidatePath(`/travesias/${existing.slug}`);
  return { status: "success", message: "Travesía actualizada." };
}

export async function deleteTrip(id: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { data: existing } = await supabase.from("trips").select("slug").eq("id", id).maybeSingle();
  const { error } = await supabase.from("trips").delete().eq("id", id);
  if (error) return { status: "error", message: "No pudimos eliminar la travesía." };
  revalidateTripPaths(existing?.slug);
  return { status: "success", message: "Travesía eliminada." };
}

/** Interruptor rápido: publicar / pasar a borrador. */
export async function toggleTripPublished(id: string, publish: boolean): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .update({ status: publish ? "published" : "draft" })
    .eq("id", id)
    .select("slug")
    .single();
  if (error) return { status: "error", message: "No pudimos actualizar la travesía." };
  revalidateTripPaths(data?.slug);
  return { status: "success", message: publish ? "Travesía publicada." : "Travesía pasada a borrador." };
}

// ---------------------------------------------------------------- Días

function parseDayForm(formData: FormData) {
  const str = (k: string) => String(formData.get(k) ?? "");
  return tripDaySchema.safeParse({
    day_label: str("day_label"),
    date_label: str("date_label"),
    title: str("title"),
    description: str("description"),
    highlights: str("highlights"),
    lodging: str("lodging"),
    meals: str("meals"),
    distance_km: str("distance_km"),
    position: str("position"),
    image_url: str("image_url"),
    image_credit: str("image_credit"),
    secondary_image_url: str("secondary_image_url"),
    secondary_image_credit: str("secondary_image_credit"),
    place_name: str("place_name"),
    place_lat: str("place_lat"),
    place_lng: str("place_lng"),
  });
}

async function tripSlug(supabase: Awaited<ReturnType<typeof createClient>>, tripId: string) {
  const { data } = await supabase.from("trips").select("slug").eq("id", tripId).maybeSingle();
  return data?.slug as string | undefined;
}

export async function createTripDay(tripId: string, _prev: TripActionState, formData: FormData): Promise<TripActionState> {
  const parsed = parseDayForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const main = await resolveImage(supabase, formData, "image_file", parsed.data.image_url, `${tripId}/dias`);
  if ("error" in main) return { status: "error", message: main.error };
  const secondary = await resolveImage(supabase, formData, "secondary_image_file", parsed.data.secondary_image_url, `${tripId}/dias`);
  if ("error" in secondary) return { status: "error", message: secondary.error };

  const { error } = await supabase.from("trip_days").insert({
    ...parsed.data,
    trip_id: tripId,
    image_url: main.url || null,
    image_thumb_url: main.thumbUrl,
    secondary_image_url: secondary.url || null,
  });
  if (error) return { status: "error", message: "No pudimos crear el día." };
  revalidateTripPaths(await tripSlug(supabase, tripId));
  revalidatePath(`/admin/travesias/${tripId}`);
  return { status: "success", message: "Día agregado." };
}

export async function updateTripDay(tripId: string, dayId: string, _prev: TripActionState, formData: FormData): Promise<TripActionState> {
  const parsed = parseDayForm(formData);
  if (!parsed.success) {
    return { status: "error", message: "Revisá los datos.", fieldErrors: parsed.error.flatten().fieldErrors };
  }
  const supabase = await createClient();
  const { data: existing } = await supabase.from("trip_days").select("image_url, image_thumb_url").eq("id", dayId).maybeSingle();
  const main = await resolveImage(supabase, formData, "image_file", parsed.data.image_url, `${tripId}/dias`);
  if ("error" in main) return { status: "error", message: main.error };
  const secondary = await resolveImage(supabase, formData, "secondary_image_file", parsed.data.secondary_image_url, `${tripId}/dias`);
  if ("error" in secondary) return { status: "error", message: secondary.error };
  const thumb = main.thumbUrl ?? (existing?.image_url === main.url ? existing?.image_thumb_url ?? null : null);

  const { error } = await supabase
    .from("trip_days")
    .update({
      ...parsed.data,
      image_url: main.url || null,
      image_thumb_url: thumb,
      secondary_image_url: secondary.url || null,
    })
    .eq("id", dayId)
    .eq("trip_id", tripId);
  if (error) return { status: "error", message: "No pudimos actualizar el día." };
  revalidateTripPaths(await tripSlug(supabase, tripId));
  revalidatePath(`/admin/travesias/${tripId}`);
  return { status: "success", message: "Día actualizado." };
}

export async function deleteTripDay(tripId: string, dayId: string): Promise<{ status: "success" | "error"; message: string }> {
  const supabase = await createClient();
  const { error } = await supabase.from("trip_days").delete().eq("id", dayId).eq("trip_id", tripId);
  if (error) return { status: "error", message: "No pudimos eliminar el día." };
  revalidateTripPaths(await tripSlug(supabase, tripId));
  revalidatePath(`/admin/travesias/${tripId}`);
  return { status: "success", message: "Día eliminado." };
}
