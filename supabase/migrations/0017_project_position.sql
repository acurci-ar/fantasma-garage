-- =========================================================================
-- Orden de aparición de los proyectos (home y /proyectos), elegible a mano
-- por el staff arrastrando en /admin/proyectos (ver reorderProjects en
-- actions/admin/projects.ts). Por defecto el más reciente va primero: se
-- backfillea a partir de created_at y createProject() inserta cada
-- proyecto nuevo con position = mínimo actual - 1, así siempre entra
-- primero salvo que alguien reordene a mano después.
-- =========================================================================

alter table public.projects
  add column position integer not null default 0;

with ranked as (
  select id, row_number() over (order by created_at desc) - 1 as rn
  from public.projects
)
update public.projects p
set position = ranked.rn
from ranked
where ranked.id = p.id;

create index projects_position_idx on public.projects (position);
