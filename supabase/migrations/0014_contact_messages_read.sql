-- =========================================================================
-- Marca de "leído" para mensajes de contacto: permite mostrar un contador
-- de no leídos por estado (Nuevos / En curso / Resueltos) en
-- /admin/mensajes. null = no leído todavía. Se completa cuando el staff
-- abre el detalle del mensaje (ver /admin/mensajes/[id]/page.tsx).
-- =========================================================================

alter table public.contact_messages
  add column read_at timestamptz;
