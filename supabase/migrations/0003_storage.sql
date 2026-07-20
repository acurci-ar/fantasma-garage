-- Fantasma Garage — Storage para imágenes subidas desde /admin
-- Bucket público de lectura (las imágenes de producto son públicas en la
-- tienda); escritura restringida a staff (admin/editor), igual criterio que
-- el resto del contenido editorial (ver 0002_rls_policies.sql).

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do nothing;

create policy "product_images_bucket_public_read"
on storage.objects for select
using (bucket_id = 'product-images');

create policy "product_images_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'product-images' and public.is_staff());

create policy "product_images_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'product-images' and public.is_staff())
with check (bucket_id = 'product-images' and public.is_staff());

create policy "product_images_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'product-images' and public.is_staff());
