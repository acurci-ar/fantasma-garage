-- Fantasma Garage — Respuestas a mensajes de contacto
-- Permite que staff responda un mensaje desde /admin/mensajes. La
-- respuesta queda registrada acá (además de enviarse por email al
-- remitente) y es visible para el cliente en /cuenta si el mensaje le
-- pertenece (mismo criterio que contact_messages_select_own).

create table public.contact_message_replies (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.contact_messages (id) on delete cascade,
  author_id uuid references auth.users (id) on delete set null,
  body text not null,
  -- false si se guardó la respuesta pero el envío de email falló o no había
  -- proveedor configurado (ver src/lib/email/resend.ts) — así el admin sabe
  -- si tiene que avisarle al cliente por otro medio.
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

create index contact_message_replies_message_idx on public.contact_message_replies (message_id);

alter table public.contact_message_replies enable row level security;

create policy "contact_message_replies_staff_all" on public.contact_message_replies
  for all using (public.is_staff()) with check (public.is_staff());

create policy "contact_message_replies_select_own" on public.contact_message_replies
  for select using (
    exists (
      select 1 from public.contact_messages m
      where m.id = message_id and m.user_id = auth.uid()
    )
  );
