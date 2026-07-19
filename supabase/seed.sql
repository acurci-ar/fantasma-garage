-- Fantasma Garage — Datos de demostración
-- TODO EL CONTENIDO DE ESTE ARCHIVO ES DE EJEMPLO. Reemplazar desde /admin
-- antes de pasar a producción. Ejecutar después de las migraciones.
-- Requiere que las imágenes referenciadas existan en /public/images o en
-- Supabase Storage (ver public/images/README-IMAGENES.md).

-- =========================================================================
-- Configuración del sitio
-- =========================================================================

insert into public.site_settings (key, value_json) values
  ('whatsapp_number', '"+54 9 11 0000-0000"'),
  ('contact_email', '"contacto@fantasmagarage.com"'),
  ('address', '"Buenos Aires, Argentina (dirección exacta a definir)"'),
  ('business_hours', '"Lunes a viernes, 9 a 18 h"'),
  ('instagram_url', '"https://www.instagram.com/chevyfantasma"'),
  ('youtube_channel_url', '"https://www.youtube.com/@ChevyFantasma"'),
  ('youtube_playlist_url', '"https://www.youtube.com/playlist?list=PL-Li2_2OPYlhQhe5zjqz-qdf2miu3Hdsz"'),
  ('years_experience', '30'),
  ('projects_completed', '80')
on conflict (key) do nothing;

-- =========================================================================
-- Servicios
-- =========================================================================

insert into public.services (slug, title, description, image_url, position, status) values
  ('restauracion-integral', 'Restauración integral', 'Recuperamos el vehículo completo, de chasis a terminación, con criterio de preservación histórica y nivel de colección.', '/images/galeria/detalles.webp', 1, 'published'),
  ('mecanica', 'Mecánica', 'Puesta a punto, reconstrucción de motor y tren delantero/trasero, con repuestos originales o de calidad equivalente.', '/images/galeria/mecanica.webp', 2, 'published'),
  ('chapa-y-pintura', 'Chapa y pintura', 'Trabajo artesanal de chapa, alineación de paneles y pintura con acabados de exhibición.', '/images/galeria/chapa.webp', 3, 'published'),
  ('repuestos', 'Repuestos', 'Búsqueda, importación y fabricación de piezas difíciles de conseguir para modelos clásicos y muscle cars.', '/images/productos/motor.webp', 4, 'published'),
  ('proyectos-especiales', 'Proyectos especiales', 'Restomods y personalizaciones a medida, manteniendo el carácter original del vehículo.', '/images/galeria/trabajos.webp', 5, 'published')
on conflict (slug) do nothing;

-- =========================================================================
-- Proyectos (demo)
-- =========================================================================

insert into public.projects (slug, title, make, model, year, summary, story, status, cover_url, featured) values
  ('chevy-camaro-1969', 'Chevy Camaro 1969', 'Chevrolet', 'Camaro', 1969, 'Restauración integral de un Camaro SS con reconstrucción completa de motor y chapa.', 'Proyecto de demostración. Llegó con más de treinta años de inactividad; se restauró preservando la identidad original de fábrica.', 'finalizado', '/images/galeria/trabajos.webp', true),
  ('chevy-nova-1972', 'Chevy Nova 1972', 'Chevrolet', 'Nova', 1972, 'Puesta a punto mecánica completa y chapa/pintura con acabado de exhibición.', 'Proyecto de demostración en curso, documentado como referencia del proceso Fantasma Garage.', 'en_curso', '/images/galeria/mecanica.webp', true),
  ('dodge-charger-1970', 'Dodge Charger 1970', 'Dodge', 'Charger', 1970, 'Restomod conservando líneas originales, con mejoras de suspensión y frenos.', 'Proyecto de demostración. Ejemplo de restomod con criterio conservador.', 'finalizado', '/images/galeria/detalles.webp', true)
on conflict (slug) do nothing;

-- =========================================================================
-- Galerías
-- =========================================================================

insert into public.galleries (slug, title, gallery_type, description, cover_url, status, published_at) values
  ('sema', 'SEMA', 'sema', 'Cobertura de exhibiciones, tendencias y vehículos del SEMA Show.', '/images/galeria/detalles.webp', 'published', now()),
  ('amigos', 'Amigos', 'amigos', 'Comunidad, encuentros y cultura alrededor de los clásicos.', '/images/galeria/mecanica.webp', 'published', now()),
  ('trabajos', 'Trabajos', 'trabajos', 'Procesos, detalles y resultados de Fantasma Garage.', '/images/galeria/chapa.webp', 'published', now())
on conflict (slug) do nothing;

-- =========================================================================
-- Videos
-- =========================================================================

insert into public.videos (youtube_url, title, featured, position, source) values
  ('https://www.youtube.com/@ChevyFantasma', 'Dentro del taller — episodio destacado', true, 1, 'manual'),
  ('https://www.youtube.com/playlist?list=PL-Li2_2OPYlhQhe5zjqz-qdf2miu3Hdsz', 'Playlist completa del canal', true, 2, 'playlist');

-- =========================================================================
-- Testimonios
-- =========================================================================

insert into public.testimonials (name, story, vehicle, status) values
  ('Cliente de demostración', 'Testimonio de ejemplo — reemplazar por casos reales desde /admin antes de publicar en producción.', 'Chevrolet Camaro 1969', 'published');

-- =========================================================================
-- Categorías y marcas (demo)
-- =========================================================================

insert into public.categories (slug, name, description, status) values
  ('suspension', 'Suspensión', 'Kits y componentes de suspensión.', 'published'),
  ('motor', 'Motor', 'Motores y componentes de motor.', 'published')
on conflict (slug) do nothing;

insert into public.brands (slug, name) values
  ('fantasma-garage-parts', 'Fantasma Garage Parts')
on conflict (slug) do nothing;

-- =========================================================================
-- Productos (demo)
-- =========================================================================

insert into public.products (
  slug, name, short_description, description, sku, price, currency, stock, low_stock_threshold,
  category_id, brand_id, status
)
select
  'kit-suspension-clasica', 'Kit de suspensión clásica', 'Kit de suspensión de alto rendimiento para muscle cars.',
  'Producto de demostración. Reemplazar por catálogo real desde /admin.', 'FG-SUSP-001', 450000, 'ARS', 6, 2,
  (select id from public.categories where slug = 'suspension'),
  (select id from public.brands where slug = 'fantasma-garage-parts'),
  'published'
where not exists (select 1 from public.products where sku = 'FG-SUSP-001');

insert into public.products (
  slug, name, short_description, description, sku, price, currency, stock, low_stock_threshold,
  category_id, brand_id, status
)
select
  'motor-reconstruido-v8', 'Motor V8 reconstruido', 'Motor V8 reconstruido a nuevo, listo para instalar.',
  'Producto de demostración. Reemplazar por catálogo real desde /admin.', 'FG-MOTOR-001', 3200000, 'ARS', 1, 1,
  (select id from public.categories where slug = 'motor'),
  (select id from public.brands where slug = 'fantasma-garage-parts'),
  'published'
where not exists (select 1 from public.products where sku = 'FG-MOTOR-001');

insert into public.product_images (product_id, url, alt, position)
select id, '/images/productos/suspension.webp', 'Kit de suspensión clásica', 1
from public.products where sku = 'FG-SUSP-001'
and not exists (select 1 from public.product_images where product_id = public.products.id);

insert into public.product_images (product_id, url, alt, position)
select id, '/images/productos/motor.webp', 'Motor V8 reconstruido', 1
from public.products where sku = 'FG-MOTOR-001'
and not exists (select 1 from public.product_images where product_id = public.products.id);

-- =========================================================================
-- Nota sobre el primer usuario admin
-- =========================================================================

-- Este seed no crea usuarios (auth.users se gestiona vía Supabase Auth).
-- Para promover tu primer usuario a admin, después de registrarte, corré:
--
--   update public.profiles set role = 'admin' where id = '<tu-user-id>';
--
-- El user id se obtiene desde el dashboard de Supabase > Authentication.
