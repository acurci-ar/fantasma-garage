-- Fantasma Garage — Expansión de Proyectos (fase 1)
-- Ficha extendida del vehículo, visibilidad pública/privada del proyecto,
-- visibilidad pública/privada por foto, y accesos otorgados a usuarios
-- puntuales sobre proyectos privados.
--
-- Diseño de privacidad (acordado con el cliente):
--  - Un proyecto puede ser público o privado. Si es privado, nadie fuera de
--    staff o accesos otorgados puede verlo, ni siquiera su ficha básica.
--  - Dentro de un proyecto público, cada foto tiene su propia visibilidad:
--    si la foto es privada, no se muestra al público general aunque el
--    proyecto sí sea público.
--  - El nombre del cliente (client_name) es siempre privado (solo staff o
--    accesos otorgados), independientemente de la visibilidad del proyecto.
--  - Documentación, presupuesto, gastos y horas trabajadas se resuelven en
--    una fase siguiente, pero ya quedan bajo la misma regla: siempre
--    privados, nunca de lectura pública.
--
-- El acceso otorgado (project_access) se guarda por email, no por user_id:
-- así se puede invitar a alguien que todavía no tiene cuenta, y el acceso
-- se resuelve solo apenas se registra (se matchea contra profiles.email).

-- =========================================================================
-- profiles.email — necesario para resolver accesos por email vía RLS
-- =========================================================================

alter table public.profiles
  add column email text;

comment on column public.profiles.email is
  'Copia de auth.users.email, para poder matchear accesos otorgados por email desde RLS sin usar el admin API.';

update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id and p.email is null;

create index profiles_email_idx on public.profiles (lower(email));

-- Se actualiza el trigger de alta de usuario para que también copie el email.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, email)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'customer', new.email);
  return new;
end;
$$;

-- =========================================================================
-- Proyectos: visibilidad + ficha extendida
-- =========================================================================

create type public.project_visibility as enum ('public', 'private');

alter table public.projects
  add column vin text,
  add column engine text,
  add column transmission text,
  add column client_name text,
  add column visibility public.project_visibility not null default 'public';

comment on column public.projects.client_name is
  'Nombre/contacto del cliente. Siempre privado: no se expone en projects_public_read, solo vía has_project_access().';

create index projects_visibility_idx on public.projects (visibility);

-- =========================================================================
-- project_images: visibilidad propia
-- =========================================================================

alter table public.project_images
  add column visibility public.project_visibility not null default 'public';

-- =========================================================================
-- project_access: usuarios puntuales con acceso a un proyecto privado
-- =========================================================================

create table public.project_access (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  email text not null,
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (project_id, email)
);

comment on table public.project_access is
  'Accesos otorgados por email a proyectos privados. Se matchea contra profiles.email en tiempo de consulta (ver has_project_access), no requiere que la persona ya tenga cuenta al momento de otorgar el acceso.';

create index project_access_project_idx on public.project_access (project_id);
create index project_access_email_idx on public.project_access (lower(email));

alter table public.project_access enable row level security;

create policy "project_access_staff_all" on public.project_access
  for all using (public.is_staff()) with check (public.is_staff());

-- El propio usuario invitado puede ver sus accesos (para listarlos en /cuenta).
create policy "project_access_select_own" on public.project_access
  for select using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and lower(p.email) = lower(project_access.email)
    )
  );

-- =========================================================================
-- has_project_access(): staff, o acceso otorgado por email, o dueño N/A
-- (los proyectos no tienen "dueño" con cuenta — el cliente es texto libre;
-- el acceso siempre pasa por project_access).
-- =========================================================================

create function public.has_project_access(p_project_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public
as $$
  select
    public.is_staff()
    or exists (
      select 1
      from public.project_access pa
      join public.profiles p on lower(p.email) = lower(pa.email)
      where pa.project_id = p_project_id and p.id = auth.uid()
    );
$$;

-- =========================================================================
-- project_is_publicly_visible(): visible + no en pausa (mismo criterio que
-- ya usaba projects_public_read para status).
-- =========================================================================

create function public.project_is_publicly_visible(p_project_id uuid)
returns boolean
language sql
stable
set search_path = public
as $$
  select exists (
    select 1 from public.projects pr
    where pr.id = p_project_id
      and pr.visibility = 'public'
      and pr.status <> 'en_pausa'
  );
$$;

-- =========================================================================
-- RLS: reemplaza las policies públicas de projects y project_images
-- =========================================================================

drop policy if exists "projects_public_read" on public.projects;

create policy "projects_public_read" on public.projects
  for select using (
    (visibility = 'public' and status <> 'en_pausa')
    or public.has_project_access(id)
  );

drop policy if exists "project_images_public_read" on public.project_images;

-- Antes: `using (true)` — cualquiera veía cualquier foto de cualquier
-- proyecto sin importar su estado. Ahora: la foto es pública solo si el
-- proyecto es público (y no está en pausa) Y la foto en sí es pública;
-- si no, hace falta acceso (staff o project_access).
create policy "project_images_public_read" on public.project_images
  for select using (
    (visibility = 'public' and public.project_is_publicly_visible(project_id))
    or public.has_project_access(project_id)
  );

-- project_images_staff_write ya existente sigue igual: solo staff escribe.
