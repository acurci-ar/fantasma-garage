-- Reemplaza el enum fijo de intereses del newsletter por una tabla editable
-- desde /admin/newsletter/intereses (ABMC), para poder sumar, sacar,
-- desactivar o reordenar tags (marcas, modelos, tipo de contenido) sin
-- tocar código cada vez.
create table public.newsletter_interests (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label text not null,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

comment on table public.newsletter_interests is
  'Tags de interés seleccionables al suscribirse al newsletter (editable desde /admin/newsletter/intereses).';

alter table public.newsletter_interests enable row level security;

-- Cualquiera puede ver los tags activos (hace falta para pintar el
-- formulario público de suscripción, sin sesión). El staff puede además
-- crear, editar, desactivar o borrar (incluye ver los inactivos).
create policy "newsletter_interests_select_active" on public.newsletter_interests
  for select using (active = true);

create policy "newsletter_interests_staff_all" on public.newsletter_interests
  for all using (public.is_staff()) with check (public.is_staff());

-- newsletter_subscribers.interests pasa de un enum fijo a texto libre: los
-- valores válidos en la práctica son los slugs vigentes en
-- newsletter_interests, validado en la capa de aplicación (Server Actions)
-- en vez de con una foreign key, para no bloquear altas existentes si se
-- renombra o borra un tag más adelante.
alter table public.newsletter_subscribers
  alter column interests type text[] using interests::text[],
  alter column interests set default '{}';

drop type public.newsletter_interest;

-- El staff necesita poder editar y eliminar cualquier suscripción desde el
-- admin (alta manual, corrección de datos, baja definitiva), no solo las
-- propias o las anónimas que ya cubría la policy de update pública.
create policy "newsletter_subscribers_staff_all" on public.newsletter_subscribers
  for all using (public.is_staff()) with check (public.is_staff());

-- Semilla inicial con los ejemplos pedidos; se edita y amplía libremente
-- desde /admin/newsletter/intereses.
insert into public.newsletter_interests (slug, label, sort_order) values
  ('eventos', 'Eventos', 1),
  ('juntadas', 'Juntadas', 2),
  ('chevrolet', 'Chevrolet', 3),
  ('ford', 'Ford', 4),
  ('chevy-opus', 'Chevy Opus', 5),
  ('chevy-nova', 'Chevy Nova', 6);
