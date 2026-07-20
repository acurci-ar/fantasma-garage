-- Suscripción a novedades por email, con áreas de interés opcionales
-- (marcas, modelos de auto, juntadas, eventos). Pensado para gente que no
-- necesariamente tiene o quiere una cuenta, así que el alta es pública y
-- anónima; si hay sesión iniciada, se linkea a user_id.
create type public.newsletter_interest as enum ('marcas', 'modelos', 'juntadas', 'eventos');

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  interests public.newsletter_interest[] not null default '{}',
  user_id uuid references auth.users (id) on delete set null,
  status text not null default 'activo' check (status in ('activo', 'baja')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.newsletter_subscribers is
  'Suscripciones al newsletter de novedades, con áreas de interés opcionales.';

create index newsletter_subscribers_user_idx on public.newsletter_subscribers (user_id);

alter table public.newsletter_subscribers enable row level security;

-- Alta pública: cualquiera puede suscribirse (con o sin sesión). Si hay
-- sesión, el registro solo puede quedar linkeado al propio usuario.
create policy "newsletter_public_insert" on public.newsletter_subscribers
  for insert with check (user_id is null or user_id = auth.uid());

-- Reinscribirse con el mismo email (mismo formulario, ej. para cambiar
-- intereses) hace un upsert por email. Se permite actualizar registros
-- anónimos o el propio, no los de otro usuario logueado.
create policy "newsletter_update_public_or_own" on public.newsletter_subscribers
  for update using (user_id is null or user_id = auth.uid())
  with check (user_id is null or user_id = auth.uid());

create policy "newsletter_select_own" on public.newsletter_subscribers
  for select using (auth.uid() = user_id);

create policy "newsletter_select_staff" on public.newsletter_subscribers
  for select using (public.is_staff());
