-- =========================================================================
-- Actualiza el catálogo global de etapas de la línea de tiempo (pedido del
-- cliente): se elimina "Motor" y se agregan "Diagnóstico", "Reformas",
-- "Pre-armado" y "Armado". Orden final:
--   Diagnóstico -> Desarme -> Chapa -> Reformas -> Pre-armado -> Pintura
--   -> Armado -> Interior -> Entrega
--
-- createProject (actions/admin/projects.ts) siembra project_stages leyendo
-- esta tabla en el momento de crear el proyecto, así que los proyectos
-- nuevos ya salen con el catálogo completo sin más cambios de código.
--
-- Para los proyectos que ya existen:
--  - Sus etapas "de catálogo" (las que siguen linkeadas a un template vía
--    template_id) se reposicionan para reflejar el nuevo orden.
--  - Se les suman las 4 etapas nuevas (Diagnóstico/Reformas/Pre-armado/
--    Armado), igual que hizo el backfill original en 0012, para que no
--    queden desactualizados respecto a un proyecto creado hoy.
--  - Ninguna etapa "Motor" ya cargada se borra: al borrarse el template,
--    esas filas quedan con template_id null (on delete set null) pero se
--    mantienen intactas —con sus fotos, videos y notas— para no perder
--    nada; el staff puede desactivarlas o borrarlas a mano por proyecto si
--    corresponde.
-- =========================================================================

delete from public.project_stage_templates where key = 'motor';

update public.project_stage_templates set position = case key
  when 'desarme'  then 1
  when 'chapa'    then 2
  when 'pintura'  then 5
  when 'interior' then 7
  when 'entrega'  then 8
  else position
end
where key in ('desarme', 'chapa', 'pintura', 'interior', 'entrega');

insert into public.project_stage_templates (key, name, position) values
  ('diagnostico', 'Diagnóstico', 0),
  ('reformas', 'Reformas', 3),
  ('pre-armado', 'Pre-armado', 4),
  ('armado', 'Armado', 6)
on conflict (key) do nothing;

comment on table public.project_stage_templates is
  'Catálogo global de hitos (Diagnóstico, Desarme, Chapa, Reformas, Pre-armado, Pintura, Armado, Interior, Entrega). Al crear un proyecto se copian acá como project_stages con enabled=true; el staff los activa/desactiva por proyecto, los reordena arrastrando y puede agregar hitos custom (project_stages sin template_id).';

-- Reposiciona las etapas ya cargadas de proyectos existentes que siguen
-- linkeadas a un template, para que respeten el nuevo orden global.
update public.project_stages ps
set position = t.position
from public.project_stage_templates t
where ps.template_id = t.id;

-- Suma las 4 etapas nuevas a los proyectos que ya existían (mismo patrón
-- que el backfill de 0012), para que no les falten respecto a uno nuevo.
insert into public.project_stages (project_id, template_id, name, position, enabled, status)
select p.id, t.id, t.name, t.position, true, 'pendiente'
from public.projects p
cross join public.project_stage_templates t
where t.key in ('diagnostico', 'reformas', 'pre-armado', 'armado')
  and not exists (
    select 1 from public.project_stages ps
    where ps.project_id = p.id and ps.template_id = t.id
  );
