-- Storage para imágenes subidas desde el ABMC de Proyectos y Galerías
-- (/admin/proyectos, /admin/galerias). Mismo criterio que
-- 0003_storage.sql: bucket público de lectura, escritura solo staff.

insert into storage.buckets (id, name, public)
values ('project-images', 'project-images', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('gallery-images', 'gallery-images', true)
on conflict (id) do nothing;

create policy "project_images_bucket_public_read"
on storage.objects for select
using (bucket_id = 'project-images');

create policy "project_images_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'project-images' and public.is_staff());

create policy "project_images_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'project-images' and public.is_staff())
with check (bucket_id = 'project-images' and public.is_staff());

create policy "project_images_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'project-images' and public.is_staff());

create policy "gallery_images_bucket_public_read"
on storage.objects for select
using (bucket_id = 'gallery-images');

create policy "gallery_images_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'gallery-images' and public.is_staff());

create policy "gallery_images_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'gallery-images' and public.is_staff())
with check (bucket_id = 'gallery-images' and public.is_staff());

create policy "gallery_images_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'gallery-images' and public.is_staff());
