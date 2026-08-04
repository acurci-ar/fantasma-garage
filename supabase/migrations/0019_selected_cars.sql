-- Fantasma Garage — Autos Seleccionados (autos a la venta)
-- Como una galería (portada + fotos + videos, ABMC arrastrable), pero con
-- ficha propia (marca/modelo/año/precio/km/motor/caja/color) y ventana de
-- vigencia de publicación (published_from/published_until). Reutiliza
-- content_status (draft/published/hidden/discontinued) por consistencia con
-- el resto del catálogo editorial: acá "discontinued" se muestra como
-- "Vendido" en el admin (ver CarForm.tsx), no hace falta un enum nuevo.

create table public.cars (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  make text not null,
  model text not null,
  year integer not null,
  price numeric(12, 2) check (price is null or price >= 0),
  currency public.currency_code not null default 'USD',
  mileage_km integer check (mileage_km is null or mileage_km >= 0),
  engine text,
  transmission text,
  color text,
  summary text not null,
  description text,
  status public.content_status not null default 'draft',
  -- Ventana de vigencia de la publicación: fuera de este rango, no aparece
  -- en /autos aunque status sea 'published' (ver RLS cars_public_read).
  published_from timestamptz,
  published_until timestamptz,
  cover_url text not null,
  cover_thumb_url text,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now()
);

comment on table public.cars is 'Autos Seleccionados: vehículos a la venta, con ficha propia y ventana de vigencia de publicación.';

create table public.car_images (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  url text not null,
  thumb_url text,
  alt text not null default '',
  position integer not null default 0
);

create type public.car_video_kind as enum ('youtube', 'file');

create table public.car_videos (
  id uuid primary key default gen_random_uuid(),
  car_id uuid not null references public.cars (id) on delete cascade,
  kind public.car_video_kind not null default 'youtube',
  youtube_url text,
  video_url text,
  position integer not null default 0
);

create index cars_status_idx on public.cars (status);
create index car_images_car_idx on public.car_images (car_id);
create index car_videos_car_idx on public.car_videos (car_id);

-- =========================================================================
-- RLS — mismo criterio que projects/galleries: lectura pública de lo
-- publicado y dentro de la ventana de vigencia, escritura solo staff.
-- =========================================================================

alter table public.cars enable row level security;
alter table public.car_images enable row level security;
alter table public.car_videos enable row level security;

create policy "cars_public_read" on public.cars
  for select using (
    (
      status = 'published'
      and (published_from is null or published_from <= now())
      and (published_until is null or published_until >= now())
    )
    or public.is_staff()
  );
create policy "cars_staff_write" on public.cars
  for all using (public.is_staff()) with check (public.is_staff());

create policy "car_images_public_read" on public.car_images
  for select using (true);
create policy "car_images_staff_write" on public.car_images
  for all using (public.is_staff()) with check (public.is_staff());

create policy "car_videos_public_read" on public.car_videos
  for select using (true);
create policy "car_videos_staff_write" on public.car_videos
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Storage — mismo criterio que 0008_content_storage.sql / project-videos
-- (0012_project_tracking.sql): bucket público de lectura, escritura staff.
-- =========================================================================

insert into storage.buckets (id, name, public)
values ('car-images', 'car-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('car-videos', 'car-videos', true)
on conflict (id) do nothing;

create policy "car_images_bucket_public_read"
on storage.objects for select
using (bucket_id = 'car-images');

create policy "car_images_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'car-images' and public.is_staff());

create policy "car_images_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'car-images' and public.is_staff())
with check (bucket_id = 'car-images' and public.is_staff());

create policy "car_images_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'car-images' and public.is_staff());

create policy "car_videos_bucket_public_read"
on storage.objects for select
using (bucket_id = 'car-videos');

create policy "car_videos_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'car-videos' and public.is_staff());

create policy "car_videos_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'car-videos' and public.is_staff())
with check (bucket_id = 'car-videos' and public.is_staff());

create policy "car_videos_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'car-videos' and public.is_staff());
