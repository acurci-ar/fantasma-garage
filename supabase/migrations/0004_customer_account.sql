-- Fantasma Garage — Mi Cuenta (cliente)
-- Vincula los mensajes de contacto a un usuario cuando se envían con sesión
-- iniciada, para poder mostrarlos en /cuenta. Los mensajes de invitado
-- (sin sesión) siguen funcionando igual, con user_id null.

alter table public.contact_messages
  add column user_id uuid references auth.users (id) on delete set null;

create index contact_messages_user_idx on public.contact_messages (user_id);

-- El insert público anterior aceptaba cualquier user_id ("with check (true)"),
-- lo que permitiría que alguien atribuyera un mensaje a otro usuario.
-- Se reemplaza por una versión que solo permite null (invitado) o el propio
-- auth.uid().
drop policy if exists "contact_messages_public_insert" on public.contact_messages;

create policy "contact_messages_public_insert" on public.contact_messages
  for insert with check (user_id is null or user_id = auth.uid());

-- Cada usuario puede ver los mensajes que envió con su cuenta (además de
-- staff, que ya podía verlos todos vía contact_messages_staff_read).
create policy "contact_messages_select_own" on public.contact_messages
  for select using (auth.uid() = user_id);
