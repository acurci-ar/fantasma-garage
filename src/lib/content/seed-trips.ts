/**
 * DATOS DE DEMOSTRACIÓN de Travesías — espejo de la carga inicial de
 * supabase/migrations/0023_trips.sql. Se usan como fallback cuando Supabase
 * no está configurado (igual que seed-data.ts para el resto del contenido),
 * así /travesias se puede revisar completa sin credenciales.
 */
import type { Trip, TripDay } from "@/types/trips";

const U = (id: string, w = 1600) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

const RUTA66_ID = "00000000-0000-0000-0000-00000000a066";

function day(
  position: number,
  data: Omit<TripDay, "id" | "trip_id" | "position" | "image_thumb_url">
): TripDay {
  return { id: `${RUTA66_ID}-${position}`, trip_id: RUTA66_ID, position, image_thumb_url: null, ...data };
}

export const RUTA66_DAYS: TripDay[] = [
  day(0, {
    day_label: "Día 0",
    date_label: "jue 4 nov",
    title: "Bienvenidos a Las Vegas",
    description:
      "Te esperamos en el aeropuerto Harry Reid y te llevamos al Venetian, a cinco minutos del Convention Center. A la noche, cena de bienvenida para conocernos: desde acá, somos una tripulación.",
    highlights: ["Recepción en el aeropuerto y traslado privado", "Check-in en The Venetian Resort", "Cena de bienvenida en el Venetian"],
    lodging: "The Venetian Resort",
    meals: "Cena",
    distance_km: null,
    image_url: U("1583207884889-d79abf0d0aa3"),
    image_credit: "Leo_Visions · Unsplash",
    secondary_image_url: U("1698309537872-9cf1df3313f0", 1200),
    secondary_image_credit: "Ronan Dorard · Unsplash",
    place_name: "Las Vegas",
    place_lat: 36.1699,
    place_lng: -115.1398,
  }),
  day(1, {
    day_label: "Día 1",
    date_label: "vie 5 nov",
    title: "SEMA Show: el día que abre al público",
    description:
      "El salón del aftermarket más grande del planeta abre sus puertas al público un solo día al año, y vos vas a estar adentro. Recorrelo libre o pegado a Javier \"Fantasma\", que te muestra lo que no está en los folletos. Cierre con rock: Hard Rock Café o Coyote Ugly.",
    highlights: ["Entrada al SEMA Show (Las Vegas Convention Center)", "Recorrido guiado opcional con Javier", "Cena en Hard Rock Café o Coyote Ugly"],
    lodging: "The Venetian Resort",
    meals: "Desayuno · Cena",
    distance_km: null,
    image_url: U("1606942790567-5783bab8d944"),
    image_credit: "Egor Vikhrev · Unsplash",
    secondary_image_url: U("1540929562752-e789ec6239d0", 1200),
    secondary_image_credit: "Mike Von · Unsplash",
    place_name: "Las Vegas Convention Center",
    place_lat: 36.131,
    place_lng: -115.1515,
  }),
  day(2, {
    day_label: "Día 2",
    date_label: "sáb 6 nov",
    title: "Tu clásico te espera en Fremont Street",
    description:
      "Entrega de los autos bajo los neones de Fremont Street, con sesión de fotos. Primera ruta corta hasta Boulder City, el pueblo que construyó la presa, almuerzo en su centro histórico y visita privada a la presa Hoover con el atardecer sobre el lago Mead. Noche en el Boulder Dam Hotel, el mismo donde dormían las estrellas de los años 30.",
    highlights: ["Entrega de autos clásicos en Fremont Street", "Almuerzo en Boulder City", "Visita privada a la presa Hoover al atardecer", "Noche en el histórico Boulder Dam Hotel (1933)"],
    lodging: "Boulder Dam Hotel",
    meals: "Desayuno · Almuerzo · Cena",
    distance_km: 55,
    image_url: U("1743813983623-273c754fab00"),
    image_credit: "Fabio Sasso · Unsplash",
    secondary_image_url: U("1653594125445-5d0ccc762ce3", 1200),
    secondary_image_credit: "Jordi Vich Navarro · Unsplash",
    place_name: "Hoover Dam · Boulder City",
    place_lat: 36.0161,
    place_lng: -114.7377,
  }),
  day(3, {
    day_label: "Día 3",
    date_label: "dom 7 nov",
    title: "El Mojave y la Ruta 66 original",
    description:
      "Cruzamos el desierto rumbo a Arizona y entramos en la Mother Road: Oatman y sus burros sueltos, almuerzo en un diner de época en Kingman, el tramo más largo que queda intacto hasta Seligman, y llegada a Williams. Noche en un motel restaurado de los años 50 con fiesta rock & roll: jukebox, neón y banda en vivo.",
    highlights: ["Oatman, pueblo minero fantasma", "Almuerzo en diner de época en Kingman", "Seligman, cuna del renacimiento de la Ruta 66", "Fiesta rock & roll en motel años 50 en Williams"],
    lodging: "Motel años 50 restaurado · Williams",
    meals: "Desayuno · Almuerzo · Cena",
    distance_km: 420,
    image_url: U("1547593480-bcf8a3bae300"),
    image_credit: "Jake Stark · Unsplash",
    secondary_image_url: U("1751759195901-3d94a29ac618", 1200),
    secondary_image_credit: "Taylor Burnfield · Unsplash",
    place_name: "Williams · Ruta 66",
    place_lat: 35.2494,
    place_lng: -112.191,
  }),
  day(4, {
    day_label: "Día 4",
    date_label: "lun 8 nov",
    title: "Gran Cañón: desde el aire y desde el fuego",
    description:
      "Subimos al borde sur del Gran Cañón y lo sobrevolamos en helicóptero: 45 minutos que no se olvidan. A la tarde, barbacoa western privada en un rancho cerca de Tusayan: fogón, parrilla de leña, música en vivo y el cielo más estrellado del viaje. Noche en El Tovar, el hotel histórico de 1905 al borde del cañón.",
    highlights: ["Vuelo en helicóptero sobre el borde sur", "Almuerzo en El Tovar Dining Room", "Barbacoa western privada al atardecer con música en vivo", "Noche en El Tovar Hotel (1905)"],
    lodging: "El Tovar Hotel · Grand Canyon Village",
    meals: "Desayuno · Almuerzo · Cena",
    distance_km: 95,
    image_url: U("1506516106576-05f78457eb6f"),
    image_credit: "AussieActive · Unsplash",
    secondary_image_url: U("1746941747862-7df9d9b16078", 1200),
    secondary_image_credit: "James Sestric · Unsplash",
    place_name: "Gran Cañón · borde sur",
    place_lat: 36.0544,
    place_lng: -112.1401,
  }),
  day(5, {
    day_label: "Día 5",
    date_label: "mar 9 nov",
    title: "Peach Springs y el Valle de Fuego",
    description:
      "Volvemos por la reserva Hualapai y Peach Springs, el pueblo que inspiró Radiator Springs. A la tarde entramos al Valle de Fuego, con sus areniscas rojas encendidas por la última luz. Noche en Las Vegas pero lejos del Strip: Downtown, cena en un speakeasy y visita nocturna al Museo del Neón.",
    highlights: ["Ruta 66 por la reserva Hualapai", "Valle de Fuego al atardecer", "Cena speakeasy en Downtown", "Visita nocturna guiada al Museo del Neón"],
    lodging: "Circa Resort · Downtown Las Vegas",
    meals: "Desayuno · Almuerzo · Cena",
    distance_km: 560,
    image_url: U("1742159770842-ae60a722a6fc"),
    image_credit: "Zoshua Colah · Unsplash",
    secondary_image_url: U("1550802915-21290e69e74d", 1200),
    secondary_image_credit: "D. Lok · Unsplash",
    place_name: "Valle de Fuego",
    place_lat: 36.4833,
    place_lng: -114.5333,
  }),
  day(6, {
    day_label: "Día 6",
    date_label: "mié 10 nov",
    title: "Pista, despedida de los clásicos y gran cierre",
    description:
      "Mañana de adrenalina en el Las Vegas Motor Speedway al volante de superdeportivos: Ferrari, Lamborghini, Corvette. Devolvemos los clásicos y almorzamos en el Golden Steer, el steakhouse de Sinatra y Elvis. A la noche, opcional \"O\" del Cirque du Soleil y cena de cierre en el Eiffel Tower Restaurant, frente a las fuentes del Bellagio.",
    highlights: ["Experiencia de pista con superdeportivos", "Almuerzo de despedida en el Golden Steer (1958)", "Cirque du Soleil \"O\" (opcional)", "Cena de cierre frente a las fuentes del Bellagio"],
    lodging: "Bellagio · Fountain View",
    meals: "Desayuno · Almuerzo · Cena",
    distance_km: 60,
    image_url: U("1630312465536-5c6b1f76dc3f"),
    image_credit: "Abdulla Al Rokhaimi · Unsplash",
    secondary_image_url: U("1668261929011-4ade8c225292", 1200),
    secondary_image_credit: "Yves Scheuber · Unsplash",
    place_name: "Las Vegas Motor Speedway",
    place_lat: 36.2719,
    place_lng: -115.01,
  }),
  day(7, {
    day_label: "Día 7",
    date_label: "jue 11 nov",
    title: "Última vuelta por Las Vegas",
    description:
      "Mañana libre para compras en Fashion Show o en los Premium Outlets, y traslado al aeropuerto. Te vas con un pendrive lleno de fotos y video, y con ganas de la próxima travesía.",
    highlights: ["Compras en Fashion Show / Premium Outlets", "Traslado privado al aeropuerto"],
    lodging: null,
    meals: "Desayuno",
    distance_km: null,
    image_url: U("1698309537872-9cf1df3313f0"),
    image_credit: "Ronan Dorard · Unsplash",
    secondary_image_url: U("1540929562752-e789ec6239d0", 1200),
    secondary_image_credit: "Mike Von · Unsplash",
    place_name: "Aeropuerto Harry Reid",
    place_lat: 36.084,
    place_lng: -115.1537,
  }),
];

export const TRIPS: Trip[] = [
  {
    id: RUTA66_ID,
    slug: "ruta-66",
    title: "Travesía Ruta 66",
    subtitle: "Las Vegas · Hoover Dam · Ruta 66 · Gran Cañón · Valle de Fuego",
    eyebrow: "SEMA Show 2027 · 4 al 11 de noviembre",
    summary:
      "Siete noches al volante de un clásico americano: del SEMA Show a la Ruta 66 original, con noche en el borde del Gran Cañón y cierre en el Strip.",
    description:
      "Una travesía pensada para quienes aman los fierros de verdad. Arrancamos en Las Vegas con el único día del SEMA Show abierto al público, recibimos los autos en Fremont Street y salimos a la ruta: la presa Hoover al atardecer, el cruce del Mojave hasta la Ruta 66 original, un motel de los años 50 con fiesta rock & roll, el Gran Cañón desde el aire y una barbacoa western bajo las estrellas. Volvemos por el Valle de Fuego y cerramos con una experiencia de pista y una cena frente a las fuentes del Bellagio. Javier \"Fantasma\" acompaña cada kilómetro.",
    status: "published",
    show_price: false,
    position: 0,
    start_date: "2027-11-04",
    end_date: "2027-11-11",
    duration_label: "7 noches · 8 días",
    price: 30000,
    currency: "USD",
    price_note: "Por persona, con auto clásico propio y vuelo en clase turista incluido.",
    min_participants: 5,
    max_participants: 15,
    cover_url: U("1622319544231-ce84790b689a", 2400),
    cover_thumb_url: null,
    cover_credit: "Brendan Stephens · Unsplash",
    cta_label: "Quiero mi lugar",
    cta_url: null,
    highlights: [
      { label: "Un clásico por persona", detail: "Mustang, Camaro, Chevelle o similar, de los años 60 y 70, a tu nombre durante toda la ruta." },
      { label: "SEMA Show 2027", detail: "El salón del aftermarket más grande del mundo, en su único día abierto al público, con Javier como anfitrión." },
      { label: "Ruta 66 original", detail: "Oatman, Kingman, Seligman y Williams: el tramo más largo que queda intacto de la Mother Road." },
      { label: "Gran Cañón desde el aire", detail: "Vuelo en helicóptero sobre el borde sur y noche en El Tovar, el hotel histórico de 1905." },
    ],
    includes: [
      "Vuelo Buenos Aires – Las Vegas ida y vuelta en clase turista",
      "Auto clásico americano por persona durante 5 días, con seguro y combustible",
      "7 noches de alojamiento (The Venetian, Boulder Dam Hotel, motel años 50 en Williams, El Tovar, Circa, Bellagio)",
      "Todas las comidas del itinerario: desayunos, almuerzos y cenas temáticas",
      "Entrada al SEMA Show (viernes público)",
      "Visita privada a la presa Hoover con guía",
      "Vuelo en helicóptero sobre el Gran Cañón",
      "Barbacoa western privada con música en vivo",
      "Fiesta rock & roll en Williams",
      "Experiencia de pista con superdeportivos en Las Vegas",
      "Museo del Neón (visita nocturna guiada) y Valle de Fuego",
      "Traslados aeropuerto – hotel y traslados grupales en Las Vegas",
      "Mecánico de apoyo con vehículo de asistencia",
      "Fotógrafo y videógrafo profesional: te llevás el material",
      "Asistencia al viajero y seguro médico",
      "Kit de bienvenida Fantasma Garage",
    ],
    excludes: ["Propinas", "Bebidas alcohólicas fuera de las comidas incluidas", "Compras personales", "Gastos no especificados en el itinerario"],
    optionals: [
      { label: "Upgrade a clase business", price: "consultar" },
      { label: "Cirque du Soleil \"O\" en el Bellagio", price: "USD 300" },
      { label: "Copiloto acompañante (comparte auto y habitación)", price: "USD 7.200" },
    ],
    // El mapa se arma con el lugar (place_*) de cada día; normalize() lo
    // deriva, así que acá va vacío.
    stops: [],
    seo_title: "Travesía Ruta 66 en autos clásicos — Fantasma Garage",
    seo_description:
      "Viaje premium en autos clásicos americanos: SEMA Show 2027, presa Hoover, Ruta 66, Gran Cañón en helicóptero y Valle de Fuego. 7 noches, todo incluido.",
    created_at: "2026-10-31T00:00:00Z",
    days: RUTA66_DAYS,
  },
];
