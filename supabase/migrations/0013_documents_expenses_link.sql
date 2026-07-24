-- =========================================================================
-- Vincular documentos con gastos/extras, y agregar miniatura + tipo MIME
-- para poder mostrar una previsualización (imagen chica o ícono por tipo
-- de archivo) en la solapa Documentos y en cada fila de Gastos.
-- =========================================================================

-- Un documento puede estar asociado a un gasto/extra puntual (ej. la foto
-- de la factura de un repuesto). `on delete set null`: si se borra el
-- gasto, el documento no se pierde, solo queda sin vincular — sigue
-- disponible en la solapa Documentos.
alter table public.project_documents
  add column expense_id uuid references public.project_expenses (id) on delete set null;

create index project_documents_expense_idx on public.project_documents (expense_id);

-- Path de una miniatura (misma convención de bucket/carpeta que file_path,
-- ver lib/supabase/upload.ts) — solo se genera cuando el archivo subido es
-- una imagen. Si es null, el front muestra un ícono genérico según
-- mime_type/extensión en vez de una miniatura real (ej. PDF, Word, etc.).
alter table public.project_documents
  add column thumbnail_path text;

alter table public.project_documents
  add column mime_type text;
