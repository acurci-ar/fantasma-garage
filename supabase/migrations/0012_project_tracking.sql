-- Fantasma Garage — Expansión de Proyectos (fase 2)
-- Línea de tiempo (hitos activables + custom), multimedia con video,
-- documentación y seguimiento de presupuesto (presupuesto inicial, gastos,
-- extras, horas trabajadas). Reutiliza has_project_access() y
-- project_is_publicly_visible() de 0011_project_expansion.sql.
--
-- Documentación, presupuesto, gastos, extras y horas son SIEMPRE privados
-- (solo staff o accesos otorgados vía project_access), sin importar la
-- visibilidad del proyecto — así lo pidió el cliente explícitamente. La
-- línea de tiempo y los videos, en cambio, siguen la visibilidad del
-- proyecto (público si el proyecto es público), igual que las fotos.

-- =========================================================================
-- Línea de tiempo: catálogo global + instancias por proyecto
-- =========================================================================

create type public.project_stage_status as enum ('pendiente', 'en_curso', 'completo');

create table public.project_stage_templates (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name text not null,
  position integer not null default 0
);

comment on table public.project_stage_templates is
  'Catálogo global de hitos (Desarme, Chapa, Motor, Pintura, Interior, Entrega). Al crear un proyecto se copian acá como project_stages con enabled=true; el staff los activa/desactiva por proyecto y puede agregar hitos custom (project_stages sin template_id).';

insert into public.project_stage_templates (key, name, position) values
  ('desarme', 'Desarme', 0),
  ('chapa', 'Chapa', 1),
  ('motor', 'Motor', 2),
  ('pintura', 'Pintura', 3),
  ('interior', 'Interior', 4),
  ('entrega', 'Entrega', 5);

create table public.project_stages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  -- null = hito custom del proyecto, sin plantilla global.
  template_id uuid references public.project_stage_templates (id) on delete set null,
  name text not null,
  position integer not null default 0,
  enabled boolean not null default true,
  status public.project_stage_status not null default 'pendiente',
  started_at date,
  completed_at date,
  notes text,
  created_at timestamptz not null default now()
);

create index project_stages_project_idx on public.project_stages (project_id);

alter table public.project_stage_templates enable row level security;
alter table public.project_stages enable row level security;

create policy "project_stage_templates_public_read" on public.project_stage_templates
  for select using (true);
create policy "project_stage_templates_staff_write" on public.project_stage_templates
  for all using (public.is_staff()) with check (public.is_staff());

create policy "project_stages_read" on public.project_stages
  for select using (
    public.project_is_publicly_visible(project_id) or public.has_project_access(project_id)
  );
create policy "project_stages_staff_write" on public.project_stages
  for all using (public.is_staff()) with check (public.is_staff());

-- Backfill: los proyectos creados antes de esta migración no tienen
-- project_stages (esa siembra la hace createProject, ver
-- actions/admin/projects.ts, solo para altas nuevas). Se les copia el mismo
-- catálogo global, todos activados, para que no arranquen con la línea de
-- tiempo vacía.
insert into public.project_stages (project_id, template_id, name, position, enabled, status)
select p.id, t.id, t.name, t.position, true, 'pendiente'
from public.projects p
cross join public.project_stage_templates t
where not exists (select 1 from public.project_stages ps where ps.project_id = p.id);

-- =========================================================================
-- project_images: asociar cada foto a un hito (además del texto libre
-- `stage` ya existente, que queda como está por compatibilidad).
-- =========================================================================

alter table public.project_images
  add column stage_id uuid references public.project_stages (id) on delete set null;

-- =========================================================================
-- Videos del proyecto: YouTube o archivo propio
-- =========================================================================

create type public.project_video_kind as enum ('youtube', 'file');

create table public.project_videos (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind public.project_video_kind not null,
  youtube_url text,
  video_url text,
  thumbnail_url text,
  visibility public.project_visibility not null default 'public',
  stage_id uuid references public.project_stages (id) on delete set null,
  position integer not null default 0,
  created_at timestamptz not null default now(),
  constraint project_videos_url_check check (
    (kind = 'youtube' and youtube_url is not null)
    or (kind = 'file' and video_url is not null)
  )
);

create index project_videos_project_idx on public.project_videos (project_id);

alter table public.project_videos enable row level security;

-- Mismo criterio que project_images: pública solo si el proyecto es público
-- Y el video en sí es público; si no, hace falta acceso otorgado o staff.
create policy "project_videos_read" on public.project_videos
  for select using (
    (visibility = 'public' and public.project_is_publicly_visible(project_id))
    or public.has_project_access(project_id)
  );
create policy "project_videos_staff_write" on public.project_videos
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Documentación: siempre privada. Se guarda el path del objeto en el bucket
-- 'project-private' (no una URL pública) — se sirve con signed URL generada
-- en el momento, solo a quien ya tiene has_project_access() (ver
-- lib/supabase/upload.ts / actions/admin/projects.ts).
-- =========================================================================

create table public.project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  name text not null,
  file_path text not null,
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_documents_project_idx on public.project_documents (project_id);

alter table public.project_documents enable row level security;

create policy "project_documents_read" on public.project_documents
  for select using (public.has_project_access(project_id));
create policy "project_documents_staff_write" on public.project_documents
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Seguimiento de presupuesto: presupuesto inicial, gastos/extras, horas.
-- Siempre privados, igual que documentación.
-- =========================================================================

create table public.project_budgets (
  project_id uuid primary key references public.projects (id) on delete cascade,
  amount numeric(12, 2),
  currency public.currency_code not null default 'ARS',
  notes text,
  updated_at timestamptz not null default now()
);

alter table public.project_budgets enable row level security;

create policy "project_budgets_read" on public.project_budgets
  for select using (public.has_project_access(project_id));
create policy "project_budgets_staff_write" on public.project_budgets
  for all using (public.is_staff()) with check (public.is_staff());

create trigger project_budgets_set_updated_at
  before update on public.project_budgets
  for each row execute procedure public.set_updated_at();

-- 'extra' = costo adicional no previsto en el presupuesto inicial (ej. algo
-- que aparece al desarmar); 'gasto' = gasto operativo normal del proyecto.
-- Se separan con `kind` en la misma tabla para poder listarlos juntos u
-- por separado según convenga en la UI.
create type public.project_expense_kind as enum ('gasto', 'extra');

create table public.project_expenses (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  kind public.project_expense_kind not null default 'gasto',
  description text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  currency public.currency_code not null default 'ARS',
  expense_date date not null default current_date,
  category text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_expenses_project_idx on public.project_expenses (project_id);

alter table public.project_expenses enable row level security;

create policy "project_expenses_read" on public.project_expenses
  for select using (public.has_project_access(project_id));
create policy "project_expenses_staff_write" on public.project_expenses
  for all using (public.is_staff()) with check (public.is_staff());

create table public.project_time_entries (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects (id) on delete cascade,
  description text,
  hours numeric(6, 2) not null check (hours > 0),
  entry_date date not null default current_date,
  actor_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

create index project_time_entries_project_idx on public.project_time_entries (project_id);

alter table public.project_time_entries enable row level security;

create policy "project_time_entries_read" on public.project_time_entries
  for select using (public.has_project_access(project_id));
create policy "project_time_entries_staff_write" on public.project_time_entries
  for all using (public.is_staff()) with check (public.is_staff());

-- =========================================================================
-- Storage
-- =========================================================================

-- Bucket privado para documentación: sin lectura pública, ni siquiera con
-- la URL del objeto. Se sirve con signed URLs generadas server-side, solo
-- para quien ya pasó has_project_access() a nivel de fila (ver
-- project_documents_read arriba). Convención de path:
-- 'project-private/{project_id}/{timestamp}-{nombre}'.
insert into storage.buckets (id, name, public)
values ('project-private', 'project-private', false)
on conflict (id) do nothing;

create policy "project_private_bucket_read"
on storage.objects for select
using (
  bucket_id = 'project-private'
  and public.has_project_access(((storage.foldername(name))[1])::uuid)
);

create policy "project_private_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'project-private' and public.is_staff());

create policy "project_private_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'project-private' and public.is_staff())
with check (bucket_id = 'project-private' and public.is_staff());

create policy "project_private_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'project-private' and public.is_staff());

-- Bucket público para clips de video propios (cortos: ver límite de tamaño
-- en lib/utils/video.ts). Mismo criterio que project-images/gallery-images.
insert into storage.buckets (id, name, public)
values ('project-videos', 'project-videos', true)
on conflict (id) do nothing;

create policy "project_videos_bucket_public_read"
on storage.objects for select
using (bucket_id = 'project-videos');

create policy "project_videos_bucket_staff_insert"
on storage.objects for insert
with check (bucket_id = 'project-videos' and public.is_staff());

create policy "project_videos_bucket_staff_update"
on storage.objects for update
using (bucket_id = 'project-videos' and public.is_staff())
with check (bucket_id = 'project-videos' and public.is_staff());

create policy "project_videos_bucket_staff_delete"
on storage.objects for delete
using (bucket_id = 'project-videos' and public.is_staff());
