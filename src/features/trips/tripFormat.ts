/** Utilidades de formato compartidas por la landing pública y el listado de travesías. */

const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function parseDate(iso: string | null): Date | null {
  if (!iso) return null;
  // Las fechas vienen como "YYYY-MM-DD" (tipo date de Postgres): se parsean a
  // mano para no correrlas un día por la zona horaria del servidor.
  const [y, m, d] = iso.split("-").map(Number);
  if (!y || !m || !d) return null;
  return new Date(Date.UTC(y, m - 1, d));
}

/** "4 al 11 de noviembre de 2027" / "28 de oct al 3 de nov de 2027". */
export function formatTripDates(start: string | null, end: string | null): string | null {
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s) return null;
  if (!e) return `${s.getUTCDate()} de ${MONTHS[s.getUTCMonth()]} de ${s.getUTCFullYear()}`;
  const sameMonth = s.getUTCMonth() === e.getUTCMonth() && s.getUTCFullYear() === e.getUTCFullYear();
  if (sameMonth) {
    return `${s.getUTCDate()} al ${e.getUTCDate()} de ${MONTHS[e.getUTCMonth()]} de ${e.getUTCFullYear()}`;
  }
  return `${s.getUTCDate()} de ${MONTHS[s.getUTCMonth()]} al ${e.getUTCDate()} de ${MONTHS[e.getUTCMonth()]} de ${e.getUTCFullYear()}`;
}

/** URL de Google Maps con todas las paradas como waypoints (abre en pestaña nueva). */
export function googleMapsRouteUrl(stops: { lat: number; lng: number }[]): string | null {
  if (stops.length < 2) return null;
  const path = stops.map((s) => `${s.lat.toFixed(4)},${s.lng.toFixed(4)}`).join("/");
  return `https://www.google.com/maps/dir/${path}`;
}
