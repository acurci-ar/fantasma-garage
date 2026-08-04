-- Fantasma Garage — Extensiones al catálogo de productos (smoke test 2026-08-03)
-- 1) Semilla de categorías iniciales (editables después desde /admin/categorias).
-- 2) products.featured: marca los productos que van a la home (FeaturedShop).
-- 3) product_internal_info: costos y proveedor, en tabla aparte (no columnas
--    en products) porque RLS en Postgres es por fila, no por columna — la
--    única forma de que esta info nunca llegue a un visitante público es que
--    viva en una tabla que ese visitante no puede ni siquiera hacer select.

-- =========================================================================
-- 1) Categorías iniciales
-- =========================================================================

insert into public.categories (slug, name, status) values
  ('motor', 'Motor', 'published'),
  ('interior', 'Interior', 'published'),
  ('accesorios', 'Accesorios', 'published'),
  ('suspension', 'Suspensión', 'published'),
  ('frenos', 'Frenos', 'published'),
  ('transmision', 'Transmisión', 'published'),
  ('chaperia', 'Chapería', 'published'),
  ('llantas', 'Llantas', 'published')
on conflict (slug) do nothing;

-- =========================================================================
-- 2) Destacados
-- =========================================================================

alter table public.products add column if not exists featured boolean not null default false;
create index if not exists products_featured_idx on public.products (featured);

-- =========================================================================
-- 3) Información interna (solo admin): proveedor, costos, cálculo de precio
-- =========================================================================

create table public.product_internal_info (
  product_id uuid primary key references public.products (id) on delete cascade,
  supplier_name text,
  supplier_link text,
  -- Lo que efectivamente se pagó por el producto (sin envío), en USD.
  cost_price numeric(12, 2) check (cost_price is null or cost_price >= 0),
  weight_kg numeric(8, 3) check (weight_kg is null or weight_kg >= 0),
  -- Costo envío = Peso × 45 USD (proxy de flete + importación + comisión del importador).
  shipping_cost numeric(12, 2) generated always as (round(coalesce(weight_kg, 0) * 45, 2)) stored,
  -- Costo Total = Precio producto (cost_price) + Costo envío: lo que realmente costó puesto en Argentina.
  total_cost numeric(12, 2) generated always as (
    round(coalesce(cost_price, 0) + coalesce(weight_kg, 0) * 45, 2)
  ) stored,
  -- Precio Sugerido = cost_price × 1.12 + costo envío × 1.5 (margen diferenciado: 12% sobre lo pagado, 50% sobre el envío).
  suggested_price numeric(12, 2) generated always as (
    round(coalesce(cost_price, 0) * 1.12 + coalesce(weight_kg, 0) * 45 * 1.5, 2)
  ) stored,
  updated_at timestamptz not null default now()
);

comment on table public.product_internal_info is 'Costos y proveedor de cada producto. Nunca se expone públicamente (ver RLS): solo admin, ni siquiera editor.';
comment on column public.product_internal_info.cost_price is 'Lo que se pagó por el producto (USD), sin envío. Corresponde a "Precio producto" en el documento de especificación.';

create trigger product_internal_info_set_updated_at
  before update on public.product_internal_info
  for each row execute procedure public.set_updated_at();

-- =========================================================================
-- RLS
-- =========================================================================

alter table public.product_internal_info enable row level security;

-- Más estricto que is_staff() (admin u editor): esta info es solo para admin.
create function public.is_admin()
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select coalesce(public.current_user_role() = 'admin', false);
$$;

create policy "product_internal_info_admin_only" on public.product_internal_info
  for all using (public.is_admin()) with check (public.is_admin());
