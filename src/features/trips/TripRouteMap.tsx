import { googleMapsRouteUrl } from "@/features/trips/tripFormat";
import type { TripStop } from "@/types/trips";

const W = 1000;
const H = 560;
const PAD = 80;
// Dos lugares que caen a menos de esta distancia (en px del dibujo) se
// muestran como un solo punto con los días combinados (ej. varios días en la
// misma ciudad), para que el mapa no quede amontonado.
const MERGE_PX = 34;

/**
 * Mapa del recorrido dibujado en SVG a partir del lugar geográfico de cada
 * día de la travesía (trip_days.place_*). Sin tiles externos ni librerías: la
 * CSP del sitio (next.config) no permite scripts ni imágenes de terceros
 * fuera de Supabase/YouTube/Unsplash, y un mapa esquemático con proyección
 * equirrectangular alcanza para contar la ruta. El botón "Abrir en Google
 * Maps" lleva a la ruta real con las paradas como waypoints.
 */
export function TripRouteMap({ stops, title }: { stops: TripStop[]; title: string }) {
  if (stops.length < 2) return null;

  const ordered = [...stops].sort((a, b) => a.day - b.day);
  const lats = ordered.map((s) => s.lat);
  const lngs = ordered.map((s) => s.lng);
  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);
  // Corrección de longitud por latitud media para que no quede achatado.
  const kx = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180));
  const spanX = Math.max((maxLng - minLng) * kx, 0.01);
  const spanY = Math.max(maxLat - minLat, 0.01);
  const scale = Math.min((W - PAD * 2) / spanX, (H - PAD * 2) / spanY);
  const offX = (W - spanX * scale) / 2;
  const offY = (H - spanY * scale) / 2;

  const project = (s: TripStop) => ({
    x: offX + (s.lng - minLng) * kx * scale,
    y: H - (offY + (s.lat - minLat) * scale),
  });

  // Puntos del mapa: se agrupan los lugares muy cercanos entre sí (misma
  // ciudad en días distintos) en un único punto con los días combinados.
  type Node = { x: number; y: number; name: string; lat: number; lng: number; days: number[] };
  const nodes: Node[] = [];
  for (const s of ordered) {
    const p = project(s);
    const near = nodes.find((n) => Math.hypot(n.x - p.x, n.y - p.y) < MERGE_PX);
    if (near) near.days.push(s.day);
    else nodes.push({ ...p, name: s.name, lat: s.lat, lng: s.lng, days: [s.day] });
  }

  const first = nodes[0];
  if (!first || nodes.length < 2) return null;
  // La ruta vuelve al punto de partida: se cierra el trazo con el primero.
  const path = [...nodes, first].map((n, i) => `${i === 0 ? "M" : "L"}${n.x.toFixed(1)},${n.y.toFixed(1)}`).join(" ");
  const mapsUrl = googleMapsRouteUrl([...nodes.map((n) => ({ lat: n.lat, lng: n.lng })), { lat: first.lat, lng: first.lng }]);

  // Lado de la etiqueta: cerca del borde izquierdo va a la derecha y
  // viceversa, para que el texto nunca se corte; en el medio, alterna.
  const sideOf = (x: number, i: number) => (x < W * 0.32 ? 1 : x > W * 0.6 ? -1 : i % 2 === 0 ? 1 : -1);
  const dayLabel = (days: number[]) => {
    const sorted = [...days].sort((a, b) => a - b);
    if (sorted.includes(0)) return "INICIO / FIN";
    return sorted.length > 1 ? `DÍAS ${sorted.join(", ")}` : `DÍA ${sorted[0]}`;
  };

  return (
    <figure className="overflow-hidden rounded-sm border border-secondary/30 bg-card/30">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-label={`Mapa esquemático del recorrido: ${nodes.map((n) => n.name).join(", ")}`}
        className="block h-auto w-full"
      >
        <defs>
          <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" stroke="#03658C" strokeOpacity="0.18" strokeWidth="1" />
          </pattern>
          <filter id="glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect width={W} height={H} fill="#070A0D" />
        <rect width={W} height={H} fill="url(#grid)" />
        <text x={PAD} y={40} fill="#EBF2F2" fillOpacity="0.5" fontSize="13" letterSpacing="3" style={{ textTransform: "uppercase" }}>
          {title.toUpperCase()} · RECORRIDO
        </text>
        <text x={W - PAD} y={40} textAnchor="end" fill="#EBF2F2" fillOpacity="0.35" fontSize="11" letterSpacing="2">
          N ↑
        </text>

        {/* Trazo de la ruta */}
        <path d={path} fill="none" stroke="#05C7F2" strokeOpacity="0.25" strokeWidth="10" strokeLinejoin="round" strokeLinecap="round" />
        <path d={path} fill="none" stroke="#05C7F2" strokeWidth="2.5" strokeDasharray="8 6" strokeLinejoin="round" strokeLinecap="round" filter="url(#glow)" />

        {/* Paradas */}
        {nodes.map((n, i) => {
          const isStart = n.days.includes(0);
          const side = sideOf(n.x, i);
          return (
            <g key={`${n.name}-${i}`}>
              <circle cx={n.x} cy={n.y} r={isStart ? 9 : 6} fill="#070A0D" stroke="#05C7F2" strokeWidth="2.5" />
              {isStart && <circle cx={n.x} cy={n.y} r={3} fill="#05C7F2" />}
              <text
                x={n.x + side * 14}
                y={n.y + 4}
                textAnchor={side > 0 ? "start" : "end"}
                fill="#EBF2F2"
                fontSize="14"
                fontWeight="600"
              >
                {n.name}
              </text>
              <text
                x={n.x + side * 14}
                y={n.y + 20}
                textAnchor={side > 0 ? "start" : "end"}
                fill="#05C7F2"
                fontSize="10"
                letterSpacing="1.5"
              >
                {dayLabel(n.days)}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="flex flex-wrap items-center justify-between gap-3 border-t border-secondary/20 px-5 py-4 text-xs text-foreground/60">
        <span>Mapa esquemático. Las distancias por día están indicadas en cada bloque del itinerario.</span>
        {mapsUrl && (
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold uppercase tracking-wide text-primary hover:underline"
          >
            Abrir en Google Maps →
          </a>
        )}
      </figcaption>
    </figure>
  );
}
