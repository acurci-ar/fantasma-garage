-- Fantasma Garage — Travesías (viajes premium en autos clásicos)
-- Nueva entrada del menú público ("Travesías") y módulo de /admin/travesias.
-- Una travesía es una landing parametrizada: hero, precio, fechas, qué
-- incluye / no incluye, opcionales y un bloque por día (trip_days). El mapa
-- del recorrido se arma con el lugar geográfico de cada día (trip_days.place_*).
-- Reutiliza content_status (draft/published/hidden) como el resto del
-- contenido editorial: una travesía 'published' aparece en la sección pública.
-- Que la sección/ítem "Travesías" aparezca o no en la web lo decide un
-- interruptor a nivel sitio (site_settings.travesias_enabled, ver 0024).

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  eyebrow text,
  summary text not null,
  description text,
  status public.content_status not null default 'draft',
  -- Si es false (default), la página pública dice "Consultar" en vez del
  -- precio; el precio interno se usa igual para proponer el total de una reserva.
  show_price boolean not null default false,
  position integer not null default 0,
  start_date date,
  end_date date,
  duration_label text,
  price numeric(12, 2) check (price is null or price >= 0),
  currency public.currency_code not null default 'USD',
  price_note text,
  min_participants integer check (min_participants is null or min_participants >= 0),
  max_participants integer check (max_participants is null or max_participants >= 0),
  cover_url text not null,
  cover_thumb_url text,
  cover_credit text,
  cta_label text,
  cta_url text,
  -- Listas editables desde el admin (una línea por ítem en el formulario):
  highlights jsonb not null default '[]'::jsonb,  -- [{label, detail}]
  includes jsonb not null default '[]'::jsonb,    -- [string]
  excludes jsonb not null default '[]'::jsonb,    -- [string]
  optionals jsonb not null default '[]'::jsonb,   -- [{label, price}]
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now()
);

comment on table public.trips is 'Travesías: viajes premium en autos clásicos. Landing parametrizada por travesía (hero, precio, incluye, mapa) + días en trip_days.';

create table public.trip_days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete cascade,
  position integer not null default 0,
  day_label text not null,            -- "Día 2"
  date_label text,                    -- "sáb 6 nov"
  title text not null,
  description text not null,
  highlights jsonb not null default '[]'::jsonb,  -- [string]
  lodging text,
  meals text,
  distance_km integer check (distance_km is null or distance_km >= 0),
  image_url text,
  image_thumb_url text,
  image_credit text,
  secondary_image_url text,
  secondary_image_credit text,
  -- Lugar geográfico del día: alimenta el mapa del recorrido (un punto por
  -- día con lugar cargado). place_name es la etiqueta en el mapa.
  place_name text,
  place_lat numeric(9, 6),
  place_lng numeric(9, 6)
);

comment on table public.trip_days is 'Bloques por día de una travesía (uno por día, con foto principal y secundaria, y un lugar geográfico para el mapa).';

create index trips_status_idx on public.trips (status);
create index trip_days_trip_idx on public.trip_days (trip_id, position);

-- =========================================================================
-- RLS — mismo criterio que cars/projects: lectura pública de lo publicado,
-- escritura solo staff.
-- =========================================================================

alter table public.trips enable row level security;
alter table public.trip_days enable row level security;

create policy "trips_public_read" on public.trips
  for select using (status = 'published' or public.is_staff());
create policy "trips_staff_write" on public.trips
  for all using (public.is_staff()) with check (public.is_staff());

create policy "trip_days_public_read" on public.trip_days
  for select using (
    exists (
      select 1 from public.trips t
      where t.id = trip_days.trip_id and (t.status = 'published' or public.is_staff())
    )
  );
create policy "trip_days_staff_write" on public.trip_days
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Storage — bucket público para fotos de travesías (portada y días).
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('trip-images', 'trip-images', true)
on conflict (id) do nothing;

create policy "trip_images_bucket_public_read"
on storage.objects for select
using (bucket_id = 'trip-images');

create policy "trip_images_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'trip-images' and public.is_staff());

create policy "trip_images_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'trip-images' and public.is_staff())
with check (bucket_id = 'trip-images' and public.is_staff());

create policy "trip_images_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'trip-images' and public.is_staff());

-- =========================================================================
-- Carga inicial: Travesía Ruta 66 (SEMA 2027). Queda publicada y en el
-- menú; se edita (o se oculta) desde /admin/travesias. Las otras dos
-- travesías del plan (Europa, Ruta 40) se crean como borrador para que
-- aparezcan en el admin listas para completar.
-- =========================================================================

insert into public.trips (
  slug, title, subtitle, eyebrow, summary, description, status, show_price, position,
  start_date, end_date, duration_label, price, currency, price_note, min_participants, max_participants,
  cover_url, cover_credit, cta_label, highlights, includes, excludes, optionals, seo_title, seo_description
) values (
  'ruta-66',
  'Travesía Ruta 66',
  'Las Vegas · Hoover Dam · Ruta 66 · Gran Cañón · Valle de Fuego',
  'SEMA Show 2027 · 4 al 11 de noviembre',
  'Siete noches al volante de un clásico americano: del SEMA Show a la Ruta 66 original, con noche en el borde del Gran Cañón y cierre en el Strip.',
  'Una travesía pensada para quienes aman los fierros de verdad. Arrancamos en Las Vegas con el único día del SEMA Show abierto al público, recibimos los autos en Fremont Street y salimos a la ruta: la presa Hoover al atardecer, el cruce del Mojave hasta la Ruta 66 original, un motel de los años 50 con fiesta rock & roll, el Gran Cañón desde el aire y una barbacoa western bajo las estrellas. Volvemos por el Valle de Fuego y cerramos con una experiencia de pista y una cena frente a las fuentes del Bellagio. Javier "Fantasma" acompaña cada kilómetro.',
  'published', false, 0,
  '2027-11-04', '2027-11-11', '7 noches · 8 días', 30000, 'USD', 'Por persona, con auto clásico propio y vuelo en clase turista incluido.', 5, 15,
  'https://images.unsplash.com/photo-1622319544231-ce84790b689a?auto=format&fit=crop&w=2400&q=80',
  'Brendan Stephens · Unsplash',
  'Quiero mi lugar',
  '[{"label":"Un clásico por persona","detail":"Mustang, Camaro, Chevelle o similar, de los años 60 y 70, a tu nombre durante toda la ruta."},{"label":"SEMA Show 2027","detail":"El salón del aftermarket más grande del mundo, en su único día abierto al público, con Javier como anfitrión."},{"label":"Ruta 66 original","detail":"Oatman, Kingman, Seligman y Williams: el tramo más largo que queda intacto de la Mother Road."},{"label":"Gran Cañón desde el aire","detail":"Vuelo en helicóptero sobre el borde sur y noche en El Tovar, el hotel histórico de 1905."}]'::jsonb,
  '["Vuelo Buenos Aires – Las Vegas ida y vuelta en clase turista","Auto clásico americano por persona durante 5 días, con seguro y combustible","7 noches de alojamiento (The Venetian, Boulder Dam Hotel, motel años 50 en Williams, El Tovar, Circa, Bellagio)","Todas las comidas del itinerario: desayunos, almuerzos y cenas temáticas","Entrada al SEMA Show (viernes público)","Visita privada a la presa Hoover con guía","Vuelo en helicóptero sobre el Gran Cañón","Barbacoa western privada con música en vivo","Fiesta rock & roll en Williams","Experiencia de pista con superdeportivos en Las Vegas","Museo del Neón (visita nocturna guiada) y Valle de Fuego","Traslados aeropuerto – hotel y traslados grupales en Las Vegas","Mecánico de apoyo con vehículo de asistencia","Fotógrafo y videógrafo profesional: te llevás el material","Asistencia al viajero y seguro médico","Kit de bienvenida Fantasma Garage"]'::jsonb,
  '["Propinas","Bebidas alcohólicas fuera de las comidas incluidas","Compras personales","Gastos no especificados en el itinerario"]'::jsonb,
  '[{"label":"Upgrade a clase business","price":"consultar"},{"label":"Cirque du Soleil \"O\" en el Bellagio","price":"USD 300"},{"label":"Copiloto acompañante (comparte auto y habitación)","price":"USD 7.200"}]'::jsonb,
  'Travesía Ruta 66 en autos clásicos — Fantasma Garage',
  'Viaje premium en autos clásicos americanos: SEMA Show 2027, presa Hoover, Ruta 66, Gran Cañón en helicóptero y Valle de Fuego. 7 noches, todo incluido.'
);

insert into public.trip_days (trip_id, position, day_label, date_label, title, description, highlights, lodging, meals, distance_km, image_url, image_credit, secondary_image_url, secondary_image_credit, place_name, place_lat, place_lng)
select t.id, d.position, d.day_label, d.date_label, d.title, d.description, d.highlights::jsonb, d.lodging, d.meals, d.distance_km, d.image_url, d.image_credit, d.secondary_image_url, d.secondary_image_credit, d.place_name, d.place_lat, d.place_lng
from public.trips t
cross join (values
  (0, 'Día 0', 'jue 4 nov', 'Bienvenidos a Las Vegas',
   'Te esperamos en el aeropuerto Harry Reid y te llevamos al Venetian, a cinco minutos del Convention Center. A la noche, cena de bienvenida para conocernos: desde acá, somos una tripulación.',
   '["Recepción en el aeropuerto y traslado privado","Check-in en The Venetian Resort","Cena de bienvenida en el Venetian"]',
   'The Venetian Resort', 'Cena', NULL,
   'https://images.unsplash.com/photo-1583207884889-d79abf0d0aa3?auto=format&fit=crop&w=1600&q=80', 'Leo_Visions · Unsplash',
   'https://images.unsplash.com/photo-1540929562752-e789ec6239d0?auto=format&fit=crop&w=1200&q=80', 'Mike Von · Unsplash',
   'Las Vegas', 36.1699, -115.1398),
  (1, 'Día 1', 'vie 5 nov', 'SEMA Show: el día que abre al público',
   'El salón del aftermarket más grande del planeta abre sus puertas al público un solo día al año, y vos vas a estar adentro. Recorrelo libre o pegado a Javier "Fantasma", que te muestra lo que no está en los folletos. Cierre con rock: Hard Rock Café o Coyote Ugly.',
   '["Entrada al SEMA Show (Las Vegas Convention Center)","Recorrido guiado opcional con Javier","Cena en Hard Rock Café o Coyote Ugly"]',
   'The Venetian Resort', 'Desayuno · Cena', NULL,
   'https://images.unsplash.com/photo-1606942790567-5783bab8d944?auto=format&fit=crop&w=1600&q=80', 'Egor Vikhrev · Unsplash',
   'https://images.unsplash.com/photo-1583207884889-d79abf0d0aa3?auto=format&fit=crop&w=1200&q=80', 'Leo_Visions · Unsplash',
   'Las Vegas Convention Center', 36.1310, -115.1515),
  (2, 'Día 2', 'sáb 6 nov', 'Tu clásico te espera en Fremont Street',
   'Entrega de los autos bajo los neones de Fremont Street, con sesión de fotos. Primera ruta corta hasta Boulder City, el pueblo que construyó la presa, almuerzo en su centro histórico y visita privada a la presa Hoover con el atardecer sobre el lago Mead. Noche en el Boulder Dam Hotel, el mismo donde dormían las estrellas de los años 30.',
   '["Entrega de autos clásicos en Fremont Street","Almuerzo en Boulder City","Visita privada a la presa Hoover al atardecer","Noche en el histórico Boulder Dam Hotel (1933)"]',
   'Boulder Dam Hotel', 'Desayuno · Almuerzo · Cena', 55,
   'https://images.unsplash.com/photo-1743813983623-273c754fab00?auto=format&fit=crop&w=1600&q=80', 'Fabio Sasso · Unsplash',
   'https://images.unsplash.com/photo-1653594125445-5d0ccc762ce3?auto=format&fit=crop&w=1200&q=80', 'Jordi Vich Navarro · Unsplash',
   'Hoover Dam · Boulder City', 36.0161, -114.7377),
  (3, 'Día 3', 'dom 7 nov', 'El Mojave y la Ruta 66 original',
   'Cruzamos el desierto rumbo a Arizona y entramos en la Mother Road: Oatman y sus burros sueltos, almuerzo en un diner de época en Kingman, el tramo más largo que queda intacto hasta Seligman, y llegada a Williams. Noche en un motel restaurado de los años 50 con fiesta rock & roll: jukebox, neón y banda en vivo.',
   '["Oatman, pueblo minero fantasma","Almuerzo en diner de época en Kingman","Seligman, cuna del renacimiento de la Ruta 66","Fiesta rock & roll en motel años 50 en Williams"]',
   'Motel años 50 restaurado · Williams', 'Desayuno · Almuerzo · Cena', 420,
   'https://images.unsplash.com/photo-1547593480-bcf8a3bae300?auto=format&fit=crop&w=1600&q=80', 'Jake Stark · Unsplash',
   'https://images.unsplash.com/photo-1751759195901-3d94a29ac618?auto=format&fit=crop&w=1200&q=80', 'Taylor Burnfield · Unsplash',
   'Williams · Ruta 66', 35.2494, -112.1910),
  (4, 'Día 4', 'lun 8 nov', 'Gran Cañón: desde el aire y desde el fuego',
   'Subimos al borde sur del Gran Cañón y lo sobrevolamos en helicóptero: 45 minutos que no se olvidan. A la tarde, barbacoa western privada en un rancho cerca de Tusayan: fogón, parrilla de leña, música en vivo y el cielo más estrellado del viaje. Noche en El Tovar, el hotel histórico de 1905 al borde del cañón.',
   '["Vuelo en helicóptero sobre el borde sur","Almuerzo en El Tovar Dining Room","Barbacoa western privada al atardecer con música en vivo","Noche en El Tovar Hotel (1905)"]',
   'El Tovar Hotel · Grand Canyon Village', 'Desayuno · Almuerzo · Cena', 95,
   'https://images.unsplash.com/photo-1506516106576-05f78457eb6f?auto=format&fit=crop&w=1600&q=80', 'AussieActive · Unsplash',
   'https://images.unsplash.com/photo-1746941747862-7df9d9b16078?auto=format&fit=crop&w=1200&q=80', 'James Sestric · Unsplash',
   'Gran Cañón · borde sur', 36.0544, -112.1401),
  (5, 'Día 5', 'mar 9 nov', 'Peach Springs y el Valle de Fuego',
   'Volvemos por la reserva Hualapai y Peach Springs, el pueblo que inspiró Radiator Springs. A la tarde entramos al Valle de Fuego, con sus areniscas rojas encendidas por la última luz. Noche en Las Vegas pero lejos del Strip: Downtown, cena en un speakeasy y visita nocturna al Museo del Neón.',
   '["Ruta 66 por la reserva Hualapai","Valle de Fuego al atardecer","Cena speakeasy en Downtown","Visita nocturna guiada al Museo del Neón"]',
   'Circa Resort · Downtown Las Vegas', 'Desayuno · Almuerzo · Cena', 560,
   'https://images.unsplash.com/photo-1742159770842-ae60a722a6fc?auto=format&fit=crop&w=1600&q=80', 'Zoshua Colah · Unsplash',
   'https://images.unsplash.com/photo-1550802915-21290e69e74d?auto=format&fit=crop&w=1200&q=80', 'D. Lok · Unsplash',
   'Valle de Fuego', 36.4833, -114.5333),
  (6, 'Día 6', 'mié 10 nov', 'Pista, despedida de los clásicos y gran cierre',
   'Mañana de adrenalina en el Las Vegas Motor Speedway al volante de superdeportivos: Ferrari, Lamborghini, Corvette. Devolvemos los clásicos y almorzamos en el Golden Steer, el steakhouse de Sinatra y Elvis. A la noche, opcional "O" del Cirque du Soleil y cena de cierre en el Eiffel Tower Restaurant, frente a las fuentes del Bellagio.',
   '["Experiencia de pista con superdeportivos","Almuerzo de despedida en el Golden Steer (1958)","Cirque du Soleil \"O\" (opcional)","Cena de cierre frente a las fuentes del Bellagio"]',
   'Bellagio · Fountain View', 'Desayuno · Almuerzo · Cena', 60,
   'https://images.unsplash.com/photo-1630312465536-5c6b1f76dc3f?auto=format&fit=crop&w=1600&q=80', 'Abdulla Al Rokhaimi · Unsplash',
   'https://images.unsplash.com/photo-1668261929011-4ade8c225292?auto=format&fit=crop&w=1200&q=80', 'Yves Scheuber · Unsplash',
   'Las Vegas Motor Speedway', 36.2719, -115.0100),
  (7, 'Día 7', 'jue 11 nov', 'Última vuelta por Las Vegas',
   'Mañana libre para compras en Fashion Show o en los Premium Outlets, y traslado al aeropuerto. Te vas con un pendrive lleno de fotos y video, y con ganas de la próxima travesía.',
   '["Compras en Fashion Show / Premium Outlets","Traslado privado al aeropuerto"]',
   NULL, 'Desayuno', NULL,
   'https://images.unsplash.com/photo-1698309537872-9cf1df3313f0?auto=format&fit=crop&w=1600&q=80', 'Ronan Dorard · Unsplash',
   'https://images.unsplash.com/photo-1540929562752-e789ec6239d0?auto=format&fit=crop&w=1200&q=80', 'Mike Von · Unsplash',
   'Aeropuerto Harry Reid', 36.0840, -115.1537)
) as d(position, day_label, date_label, title, description, highlights, lodging, meals, distance_km, image_url, image_credit, secondary_image_url, secondary_image_credit, place_name, place_lat, place_lng)
where t.slug = 'ruta-66';

insert into public.trips (slug, title, subtitle, eyebrow, summary, status, position, cover_url, cover_credit)
values
  ('europa-alemania-italia', 'Travesía Europa', 'Alemania – Italia', 'Próximamente', 'De los museos de Stuttgart y Múnich a los pasos alpinos y la Motor Valley italiana, en clásicos europeos.', 'draft', 1,
   'https://images.unsplash.com/photo-1540929562752-e789ec6239d0?auto=format&fit=crop&w=2400&q=80', 'Mike Von · Unsplash'),
  ('ruta-40', 'Travesía Ruta 40', 'Argentina', 'Próximamente', 'La ruta más larga del país en clásicos argentinos: Chevys, Torinos y Falcons de la Puna a la Patagonia.', 'draft', 2,
   'https://images.unsplash.com/photo-1550802915-21290e69e74d?auto=format&fit=crop&w=2400&q=80', 'D. Lok · Unsplash');
