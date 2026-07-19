-- Fantasma Garage — Esquema inicial
-- Corresponde al modelo de datos de la sección 8 del documento de especificación.
-- Ejecutar en orden: 0001_init.sql -> 0002_rls_policies.sql -> ../seed.sql

create extension if not exists "pgcrypto";

-- =========================================================================
-- Roles y perfiles
-- =========================================================================

create type public.user_role as enum ('admin', 'editor', 'customer');

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  phone text,
  role public.user_role not null default 'customer',
  created_at timestamptz not null default now()
);

comment on table public.profiles is 'Perfil extendido de cada usuario de auth.users.';

-- Crea automáticamente un profile al registrarse un usuario.
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'customer');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =========================================================================
-- Catálogo: marcas, categorías, productos
-- =========================================================================

create type public.content_status as enum ('draft', 'published', 'hidden', 'discontinued');
create type public.currency_code as enum ('ARS', 'USD');

create table public.brands (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  logo_url text
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text,
  image_url text,
  status public.content_status not null default 'draft'
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  short_description text,
  description text,
  sku text not null unique,
  price numeric(12, 2) not null check (price >= 0),
  sale_price numeric(12, 2) check (sale_price is null or sale_price >= 0),
  currency public.currency_code not null default 'ARS',
  stock integer not null default 0 check (stock >= 0),
  low_stock_threshold integer not null default 2,
  category_id uuid references public.categories (id) on delete set null,
  brand_id uuid references public.brands (id) on delete set null,
  status public.content_status not null default 'draft',
  weight_kg numeric(8, 3),
  width_cm numeric(8, 2),
  height_cm numeric(8, 2),
  depth_cm numeric(8, 2),
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  url text not null,
  alt text not null default '',
  position integer not null default 0
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  name text not null, -- ej: "Talle", "Color", "Terminación"
  value text not null, -- ej: "M", "Rojo", "Cromado"
  sku text unique,
  price_delta numeric(12, 2) not null default 0,
  stock integer not null default 0 check (stock >= 0)
);

-- =========================================================================
-- Pedidos, ítems y movimientos de inventario
-- =========================================================================

create type public.order_status as enum (
  'pendiente_pago', 'pagado', 'preparando', 'enviado', 'entregado', 'cancelado', 'reembolsado'
);
create type public.payment_status as enum ('pendiente', 'aprobado', 'rechazado', 'reembolsado');

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users (id) on delete set null,
  status public.order_status not null default 'pendiente_pago',
  payment_status public.payment_status not null default 'pendiente',
  total numeric(12, 2) not null default 0,
  currency public.currency_code not null default 'ARS',
  mp_payment_id text,
  mp_preference_id text,
  customer_snapshot jsonb not null default '{}'::jsonb,
  shipping_snapshot jsonb not null default '{}'::jsonb,
  tracking_number text,
  internal_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id),
  variant_id uuid references public.product_variants (id),
  product_snapshot jsonb not null default '{}'::jsonb,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price >= 0)
);

create type public.inventory_movement_type as enum ('compra', 'venta', 'devolucion', 'correccion', 'reserva');

create table public.inventory_movements (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  variant_id uuid references public.product_variants (id),
  type public.inventory_movement_type not null,
  quantity integer not null,
  reason text,
  actor_id uuid references auth.users (id),
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Proyectos
-- =========================================================================

create type public.project_status as enum ('en_curso', 'finalizado', 'en_pausa');

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  make text not null,
  model text not null,
  year integer not null,
  summary text not null,
  story text,
  status public.project_status not null default 'en_curso',
  cover_url text not null,
  featured boolean not null default false,
  seo_title text,
  seo_description text,
  created_at timestamptz not null default now()
);

create table public.project_images (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  url text not null,
  alt text not null default '',
  stage text,
  position integer not null default 0,
  is_before boolean not null default false,
  is_after boolean not null default false
);

-- =========================================================================
-- Galerías (SEMA / Amigos / Trabajos)
-- =========================================================================

create type public.gallery_type as enum ('sema', 'amigos', 'trabajos');

create table public.galleries (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  gallery_type public.gallery_type not null,
  description text,
  cover_url text not null,
  status public.content_status not null default 'draft',
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gallery_images (
  id uuid primary key default gen_random_uuid(),
  gallery_id uuid not null references public.galleries (id) on delete cascade,
  url text not null,
  alt text not null default '',
  caption text,
  position integer not null default 0
);

-- =========================================================================
-- Videos, servicios, testimonios
-- =========================================================================

create type public.video_source as enum ('playlist', 'manual');

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  youtube_url text not null,
  title text not null,
  thumbnail_url text,
  featured boolean not null default false,
  position integer not null default 0,
  source public.video_source not null default 'manual',
  created_at timestamptz not null default now()
);

create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null,
  image_url text not null,
  position integer not null default 0,
  status public.content_status not null default 'draft'
);

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  story text not null,
  vehicle text,
  image_url text,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Contacto, configuración del sitio, auditoría
-- =========================================================================

create type public.contact_message_status as enum ('nuevo', 'en_proceso', 'resuelto');

create table public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email text not null,
  phone text,
  subject text not null,
  message text not null,
  status public.contact_message_status not null default 'nuevo',
  created_at timestamptz not null default now()
);

create table public.site_settings (
  key text primary key,
  value_json jsonb not null,
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id),
  entity_type text not null,
  entity_id text not null,
  action text not null,
  changes_json jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- =========================================================================
-- Índices de soporte
-- =========================================================================

create index products_status_idx on public.products (status);
create index products_category_idx on public.products (category_id);
create index products_brand_idx on public.products (brand_id);
create index orders_user_idx on public.orders (user_id);
create index orders_status_idx on public.orders (status);
create index order_items_order_idx on public.order_items (order_id);
create index projects_featured_idx on public.projects (featured);
create index gallery_images_gallery_idx on public.gallery_images (gallery_id);
create index inventory_movements_product_idx on public.inventory_movements (product_id);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);

-- =========================================================================
-- updated_at automático
-- =========================================================================

create function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
  before update on public.products
  for each row execute procedure public.set_updated_at();

create trigger orders_set_updated_at
  before update on public.orders
  for each row execute procedure public.set_updated_at();
