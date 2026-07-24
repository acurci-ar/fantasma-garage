-- =========================================================================
-- Alta automática al newsletter cuando alguien se registra: además del
-- profile, handle_new_user() ahora también da de alta (o reactiva) una
-- fila en newsletter_subscribers, con los intereses que haya marcado en el
-- formulario de registro (ver AuthForm.tsx, que los manda en
-- options.data.newsletter_interests al hacer signUp — quedan en
-- auth.users.raw_user_meta_data).
--
-- Corre en el mismo trigger (security definer, bypassa RLS) que ya crea el
-- profile, así que pasa en la misma transacción que el alta del usuario —
-- no depende de que confirme el email ni de que abra el modal de
-- newsletter por su cuenta, que es el problema que se estaba resolviendo
-- (usuarios registrados que no terminaban en el newsletter salvo que se
-- suscribieran a mano).
-- =========================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_interests text[];
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'customer');

  -- Solo se guardan los slugs que existen y siguen activos en
  -- newsletter_interests (mismo criterio que subscribeNewsletter en
  -- actions/newsletter.ts), para no arrastrar tags viejos o inválidos.
  select coalesce(array_agg(value), '{}')
    into requested_interests
    from jsonb_array_elements_text(coalesce(new.raw_user_meta_data -> 'newsletter_interests', '[]'::jsonb)) as value
    where value in (select slug from public.newsletter_interests where active);

  insert into public.newsletter_subscribers (email, interests, user_id, status)
  values (new.email, coalesce(requested_interests, '{}'), new.id, 'activo')
  on conflict (email) do update
    set user_id = excluded.user_id,
        interests = excluded.interests,
        status = 'activo',
        updated_at = now();

  return new;
end;
$$;
