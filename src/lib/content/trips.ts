import "server-only";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { TRIPS } from "@/lib/content/seed-trips";
import type { Trip, TripDay, TripReservation } from "@/types/trips";

/**
 * Capa de acceso a Travesías — mismo criterio que lib/content/queries.ts:
 * lee de Supabase si está configurado y cae a los datos seed si no. RLS
 * (0023_trips.sql) ya filtra: un visitante solo ve travesías publicadas, el
 * staff ve todo (incluidos borradores, para previsualizar).
 */
async function safeQuery<T>(fn: () => Promise<T>, fallback: T): Promise<T> {
  if (!isSupabaseConfigured()) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.warn("[trips] Falling back to seed data:", (error as Error).message);
    return fallback;
  }
}

function normalize(trip: Trip): Trip {
  const days = [...(trip.days ?? [])]
    .map((d) => ({ ...d, highlights: Array.isArray(d.highlights) ? d.highlights : [] }))
    .sort((a, b) => a.position - b.position);
  // El mapa se arma con el lugar de cada día (place_*): un punto por día que
  // tenga lugar cargado, en el orden del itinerario.
  const dayStops = days
    .filter((d) => d.place_name && d.place_lat !== null && d.place_lng !== null)
    .map((d) => ({ name: d.place_name as string, lat: Number(d.place_lat), lng: Number(d.place_lng), day: d.position }));
  return {
    ...trip,
    highlights: Array.isArray(trip.highlights) ? trip.highlights : [],
    includes: Array.isArray(trip.includes) ? trip.includes : [],
    excludes: Array.isArray(trip.excludes) ? trip.excludes : [],
    optionals: Array.isArray(trip.optionals) ? trip.optionals : [],
    stops: dayStops,
    days,
  };
}

const PUBLISHED_SEED = TRIPS.filter((t) => t.status === "published");

/** Travesías publicadas para el bloque de la página principal (si el sitio
 * tiene la sección activada; ese chequeo lo hace la home con getSiteSettings). */
export async function getHomeTrips(limit = 3): Promise<Trip[]> {
  const trips = await getVisibleTrips();
  return trips.filter((t) => t.status === "published").slice(0, limit);
}

/** Listado público (/travesias). RLS deja pasar borradores solo al staff. */
export async function getVisibleTrips(): Promise<Trip[]> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trips")
      .select("*, days:trip_days(*)")
      .order("position", { ascending: true });
    if (error) throw error;
    return ((data ?? []) as Trip[]).map(normalize);
  }, PUBLISHED_SEED.map(normalize));
}

export async function getTripBySlug(slug: string): Promise<Trip | null> {
  return safeQuery(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("trips")
      .select("*, days:trip_days(*)")
      .eq("slug", slug)
      .maybeSingle();
    if (error) throw error;
    return data ? normalize(data as Trip) : null;
  }, PUBLISHED_SEED.map(normalize).find((t) => t.slug === slug) ?? null);
}

/** Admin: sin fallback a seed (si falla, se muestra el error). */
export async function getTripsForAdmin(): Promise<{ trips: Trip[]; error: string | null }> {
  if (!isSupabaseConfigured()) return { trips: [], error: null };
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("trips")
    .select("*, days:trip_days(*)")
    .order("position", { ascending: true });
  return { trips: ((data ?? []) as Trip[]).map(normalize), error: error?.message ?? null };
}

export async function getTripByIdForAdmin(id: string): Promise<Trip | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("trips").select("*, days:trip_days(*)").eq("id", id).maybeSingle();
  return data ? normalize(data as Trip) : null;
}

/** Reservas del cliente logueado. Lee la vista my_trip_reservations (filtra
 * por user_id o email de la sesión y NO expone admin_notes; trae pagos y
 * datos de la travesía embebidos). */
export async function getMyReservations(): Promise<TripReservation[]> {
  if (!isSupabaseConfigured()) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("my_trip_reservations")
    .select("*")
    .order("created_at", { ascending: false });
  return ((data ?? []) as TripReservation[]).map(normalizeReservation);
}

/** Una reserva del cliente logueado por id (misma vista; null si no es suya). */
export async function getMyReservationById(id: string): Promise<TripReservation | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("my_trip_reservations").select("*").eq("id", id).maybeSingle();
  return data ? normalizeReservation(data as TripReservation) : null;
}

/** Admin: todas las reservas (opcionalmente de una travesía). */
export async function getReservationsForAdmin(tripId?: string): Promise<{ reservations: TripReservation[]; error: string | null }> {
  if (!isSupabaseConfigured()) return { reservations: [], error: null };
  const supabase = await createClient();
  let query = supabase
    .from("trip_reservations")
    .select("*, payments:trip_payments(*), trip:trips(id, slug, title, start_date, end_date, cover_url, cover_thumb_url)")
    .order("created_at", { ascending: false });
  if (tripId) query = query.eq("trip_id", tripId);
  const { data, error } = await query;
  return { reservations: ((data ?? []) as TripReservation[]).map(normalizeReservation), error: error?.message ?? null };
}

export async function getReservationByIdForAdmin(id: string): Promise<TripReservation | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("trip_reservations")
    .select("*, payments:trip_payments(*), trip:trips(id, slug, title, start_date, end_date, cover_url, cover_thumb_url)")
    .eq("id", id)
    .maybeSingle();
  return data ? normalizeReservation(data as TripReservation) : null;
}

function normalizeReservation(r: TripReservation): TripReservation {
  return {
    ...r,
    total_amount: Number(r.total_amount),
    options: Array.isArray(r.options) ? r.options : [],
    payments: [...(r.payments ?? [])]
      .map((p) => ({ ...p, amount: Number(p.amount) }))
      .sort((a, b) => (a.paid_at < b.paid_at ? 1 : a.paid_at > b.paid_at ? -1 : 0)),
  };
}

export type { Trip, TripDay, TripReservation };
