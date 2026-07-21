-- Miniaturas generadas del lado del servidor al subir un archivo (ver
-- src/lib/supabase/upload.ts: uploadImageToBucket genera, con sharp, una
-- versión "display" (la que ya se guardaba como url) y una miniatura chica
-- para grillas/tarjetas, evitando que esas vistas bajen la foto completa.
--
-- Nullable a propósito: las URLs pegadas a mano (sin subir archivo) no
-- tienen miniatura generada, así que el front cae de nuevo a la imagen
-- completa en esos casos (thumb_url ?? url).
alter table public.product_images add column if not exists thumb_url text;
alter table public.project_images add column if not exists thumb_url text;
alter table public.gallery_images add column if not exists thumb_url text;
alter table public.projects add column if not exists cover_thumb_url text;
alter table public.galleries add column if not exists cover_thumb_url text;
