-- Fantasma Garage — Row Level Security
-- Principio: lectura pública solo de contenido publicado; escritura
-- restringida a admin/editor; pedidos visibles solo para su dueño o admin.
-- No confiar solo en ocultar botones del frontend (sección 7.1).

-- =========================================================================
-- Helper: rol del usuario autenticado
-- =========================================================================

create function public.current_user_role()
returns public.user_role
language sql
security definer
stable
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() in ('admin', 'editor'), false);
$$;

-- =========================================================================
-- Activar RLS en todas las tablas
-- =========================================================================

alter table public.profiles enable row level security;
alter table public.brands enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_movements enable row level security;
alter table public.projects enable row level security;
alter table public.project_images enable row level security;
alter table public.galleries enable row level security;
alter table public.gallery_images enable row level security;
alter table public.videos enable row level security;
alter table public.services enable row level security;
alter table public.testimonials enable row level security;
alter table public.contact_messages enable row level security;
alter table public.site_settings enable row level security;
alter table public.audit_logs enable row level security;

-- =========================================================================
-- profiles: cada usuario ve/edita el suyo; staff ve todos
-- =========================================================================

create policy "profiles_select_own_or_staff" on public.profiles
  for select using (auth.uid() = id or public.is_staff());

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);

create policy "profiles_staff_manage" on public.profiles
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Catálogo público: lectura de publicado para todos, escritura solo staff
-- =========================================================================

create policy "brands_public_read" on public.brands
  for select using (true);
create policy "brands_staff_write" on public.brands
  for all using (public.is_staff()) with check (public.is_staff());

create policy "categories_public_read" on public.categories
  for select using (status = 'published' or public.is_staff());
create policy "categories_staff_write" on public.categories
  for all using (public.is_staff()) with check (public.is_staff());

create policy "products_public_read" on public.products
  for select using (status = 'published' or public.is_staff());
create policy "products_staff_write" on public.products
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_images_public_read" on public.product_images
  for select using (true);
create policy "product_images_staff_write" on public.product_images
  for all using (public.is_staff()) with check (public.is_staff());

create policy "product_variants_public_read" on public.product_variants
  for select using (true);
create policy "product_variants_staff_write" on public.product_variants
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Pedidos: dueño o staff. Insert público controlado por Server Actions
-- (el cliente autenticado crea su propio pedido; el pago se confirma
-- exclusivamente por el webhook de Mercado Pago con la service role key,
-- que bypassa RLS).
-- =========================================================================

create policy "orders_select_own_or_staff" on public.orders
  for select using (auth.uid() = user_id or public.is_staff());

create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id or user_id is null);

create policy "orders_staff_update" on public.orders
  for update using (public.is_staff());

create policy "order_items_select_own_or_staff" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id and (o.user_id = auth.uid() or public.is_staff())
    )
  );

create policy "order_items_staff_write" on public.order_items
  for all using (public.is_staff()) with check (public.is_staff());

create policy "inventory_movements_staff_only" on public.inventory_movements
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Contenido editorial: lectura pública de publicado, escritura solo staff
-- =========================================================================

create policy "projects_public_read" on public.projects
  for select using (status <> 'en_pausa' or public.is_staff());
create policy "projects_staff_write" on public.projects
  for all using (public.is_staff()) with check (public.is_staff());

create policy "project_images_public_read" on public.project_images
  for select using (true);
create policy "project_images_staff_write" on public.project_images
  for all using (public.is_staff()) with check (public.is_staff());

create policy "galleries_public_read" on public.galleries
  for select using (status = 'published' or public.is_staff());
create policy "galleries_staff_write" on public.galleries
  for all using (public.is_staff()) with check (public.is_staff());

create policy "gallery_images_public_read" on public.gallery_images
  for select using (true);
create policy "gallery_images_staff_write" on public.gallery_images
  for all using (public.is_staff()) with check (public.is_staff());

create policy "videos_public_read" on public.videos
  for select using (true);
create policy "videos_staff_write" on public.videos
  for all using (public.is_staff()) with check (public.is_staff());

create policy "services_public_read" on public.services
  for select using (status = 'published' or public.is_staff());
create policy "services_staff_write" on public.services
  for all using (public.is_staff()) with check (public.is_staff());

create policy "testimonials_public_read" on public.testimonials
  for select using (status = 'published' or public.is_staff());
create policy "testimonials_staff_write" on public.testimonials
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Contacto: cualquiera puede insertar (formulario público); solo staff lee
-- =========================================================================

create policy "contact_messages_public_insert" on public.contact_messages
  for insert with check (true);
create policy "contact_messages_staff_read" on public.contact_messages
  for select using (public.is_staff());
create policy "contact_messages_staff_update" on public.contact_messages
  for update using (public.is_staff());

-- =========================================================================
-- Configuración del sitio: lectura pública, escritura solo staff
-- =========================================================================

create policy "site_settings_public_read" on public.site_settings
  for select using (true);
create policy "site_settings_staff_write" on public.site_settings
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Auditoría: solo staff, y solo lectura (los inserts los hace el backend
-- con service role o vía funciones security definer específicas)
-- =========================================================================

create policy "audit_logs_staff_read" on public.audit_logs
  for select using (public.is_staff());
