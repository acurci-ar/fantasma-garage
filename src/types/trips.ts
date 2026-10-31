import type { ContentStatus, ISODateString, UUID } from "@/types/database";

/**
 * Travesías — viajes premium en autos clásicos (ver
 * supabase/migrations/0023_trips.sql). Una travesía es una landing
 * parametrizada: todo lo que se ve en /travesias/[slug] sale de estos
 * campos y de sus días (TripDay), editables desde /admin/travesias.
 */

export interface TripHighlight {
  label: string;
  detail: string;
}

export interface TripOptional {
  label: string;
  /** Texto libre: "USD 300", "consultar". */
  price: string;
}

export interface TripStop {
  name: string;
  lat: number;
  lng: number;
  /** Número de día del itinerario en el que se pasa por la parada (para el mapa). */
  day: number;
}

export interface TripDay {
  id: UUID;
  trip_id: UUID;
  position: number;
  day_label: string;
  date_label: string | null;
  title: string;
  description: string;
  highlights: string[];
  lodging: string | null;
  meals: string | null;
  distance_km: number | null;
  image_url: string | null;
  image_thumb_url: string | null;
  image_credit: string | null;
  secondary_image_url: string | null;
  secondary_image_credit: string | null;
  /** Lugar geográfico del día; con lat/lng alimenta el mapa del recorrido. */
  place_name: string | null;
  place_lat: number | null;
  place_lng: number | null;
}

export interface Trip {
  id: UUID;
  slug: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  summary: string;
  description: string | null;
  status: ContentStatus;
  /** Si es false, la página pública dice "Consultar" en vez del precio. */
  show_price: boolean;
  position: number;
  start_date: string | null;
  end_date: string | null;
  duration_label: string | null;
  price: number | null;
  currency: "ARS" | "USD";
  price_note: string | null;
  min_participants: number | null;
  max_participants: number | null;
  cover_url: string;
  cover_thumb_url: string | null;
  cover_credit: string | null;
  cta_label: string | null;
  /** Si está vacío, el CTA lleva al formulario de contacto con el asunto precargado. */
  cta_url: string | null;
  highlights: TripHighlight[];
  includes: string[];
  excludes: string[];
  optionals: TripOptional[];
  /** Paradas del mapa. Campo derivado (no está en la base): se arma en normalize() a partir de los días con lugar (place_*). */
  stops: TripStop[];
  seo_title: string | null;
  seo_description: string | null;
  created_at: ISODateString;
  days: TripDay[];
}

export type TripReservationStatus = "solicitada" | "lista_espera" | "confirmada" | "senada" | "pagada" | "cancelada";
export type TripPaymentMethod = "transferencia" | "tarjeta" | "efectivo" | "cripto" | "otro";

export interface TripReservationOption {
  label: string;
  price: number;
}

export interface TripPayment {
  id: UUID;
  reservation_id: UUID;
  amount: number;
  currency: "ARS" | "USD";
  method: TripPaymentMethod;
  paid_at: string;
  reference: string | null;
  note: string | null;
  created_by: UUID | null;
  created_at: ISODateString;
}

export interface TripReservation {
  id: UUID;
  trip_id: UUID;
  user_id: UUID | null;
  full_name: string;
  email: string;
  phone: string | null;
  participants: number;
  with_copilot: boolean;
  car_preference: string | null;
  message: string | null;
  status: TripReservationStatus;
  currency: "ARS" | "USD";
  total_amount: number;
  options: TripReservationOption[];
  /** Visibles para el cliente en /cuenta. */
  public_notes: string | null;
  /** Solo staff. Opcional: la vista del cliente (my_trip_reservations) no lo trae. */
  admin_notes?: string | null;
  created_at: ISODateString;
  updated_at: ISODateString;
  payments?: TripPayment[];
  trip?: Pick<Trip, "id" | "slug" | "title" | "start_date" | "end_date" | "cover_url" | "cover_thumb_url">;
}

export const TRIP_RESERVATION_STATUS_LABEL: Record<TripReservationStatus, string> = {
  solicitada: "Solicitada",
  lista_espera: "Lista de espera",
  confirmada: "Confirmada",
  senada: "Señada",
  pagada: "Pagada",
  cancelada: "Cancelada",
};

export const TRIP_PAYMENT_METHOD_LABEL: Record<TripPaymentMethod, string> = {
  transferencia: "Transferencia",
  tarjeta: "Tarjeta",
  efectivo: "Efectivo",
  cripto: "Cripto",
  otro: "Otro",
};

/** Total pagado y saldo de una reserva (misma moneda que la reserva). */
export function reservationBalance(reservation: Pick<TripReservation, "total_amount" | "payments">) {
  const paid = (reservation.payments ?? []).reduce((acc, p) => acc + Number(p.amount), 0);
  return { paid, balance: Math.max(Number(reservation.total_amount) - paid, 0) };
}
