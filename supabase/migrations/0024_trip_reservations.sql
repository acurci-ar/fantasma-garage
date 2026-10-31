-- Fantasma Garage — Travesías, etapa 2: reservas con pagos + interruptor de
-- sitio para la sección Travesías.
--
-- Decisiones (acordadas con el dueño, oct-2026):
--  * La sección/ítem "Travesías" aparece en la web solo si está activado el
--    interruptor a nivel sitio (site_settings.travesias_enabled). Cada
--    travesía, además, se muestra en la sección solo si está 'published'.
--  * El llamado a la acción público es una CONSULTA (va a contact_messages,
--    bandeja Mensajes). Las RESERVAS las crea y gestiona el staff desde
--    /admin/reservas: estado, total acordado, opcionales, pagos, saldo y
--    notas (públicas para el cliente / privadas del staff).
--  * El cliente ve sus reservas en /cuenta: por user_id o por el email de su
--    sesión (una reserva cargada con su email aparece cuando se registra con
--    ese mismo email). Los pagos los carga el staff a mano; el saldo se calcula.

-- ---------------------------------------------------------------- site switch
-- Interruptor a nivel sitio. Se guarda como una fila más de site_settings
-- (key/value_json). Default true: al aplicar esta migración la sección queda
-- activa; se apaga desde /admin/configuracion.
insert into public.site_settings (key, value_json)
values ('travesias_enabled', 'true'::jsonb)
on conflict (key) do nothing;

-- ---------------------------------------------------------------- reservas
create type public.trip_reservation_status as enum (
  'solicitada', 'lista_espera', 'confirmada', 'senada', 'pagada', 'cancelada'
);

create type public.trip_payment_method as enum ('transferencia', 'tarjeta', 'efectivo', 'cripto', 'otro');

create table public.trip_reservations (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips (id) on delete restrict,
  -- Si el cliente ya tenía cuenta al reservar, queda vinculado por user_id.
  -- Si no, se vincula por email al registrarse con ese mismo email (ver RLS).
  user_id uuid references auth.users (id) on delete set null,
  full_name text not null,
  email text not null,
  phone text,
  participants integer not null default 1 check (participants >= 1),
  with_copilot boolean not null default false,
  car_preference text,
  message text,
  status public.trip_reservation_status not null default 'solicitada',
  currency public.currency_code not null default 'USD',
  total_amount numeric(12, 2) not null default 0 check (total_amount >= 0),
  -- Opcionales acordados: [{"label":"Upgrade business","price":3300}]
  options jsonb not null default '[]'::jsonb,
  -- Notas visibles para el cliente en /cuenta (confirmaciones, pasos a seguir).
  public_notes text,
  -- Notas internas del staff; nunca salen al cliente.
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.trip_reservations is 'Reservas de travesías. Las crea y gestiona el staff desde /admin/reservas; el cliente las ve en /cuenta por user_id o email.';

create table public.trip_payments (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.trip_reservations (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  currency public.currency_code not null default 'USD',
  method public.trip_payment_method not null default 'transferencia',
  paid_at date not null default current_date,
  reference text,
  note text,
  created_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

comment on table public.trip_payments is 'Pagos registrados a mano por el staff contra una reserva. El saldo = total_amount − sum(amount).';

create index trip_reservations_trip_idx on public.trip_reservations (trip_id, status);
create index trip_reservations_email_idx on public.trip_reservations (lower(email));
create index trip_reservations_user_idx on public.trip_reservations (user_id);
create index trip_payments_reservation_idx on public.trip_payments (reservation_id);

create or replace function public.touch_trip_reservation_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end $$;

create trigger trip_reservations_touch
before update on public.trip_reservations
for each row execute function public.touch_trip_reservation_updated_at();

-- ---------------------------------------------------------------- RLS
-- Las tablas base son SOLO para staff (tanto escribir como leer): así
-- admin_notes (notas internas) nunca es accesible para un cliente, ni
-- siquiera vía API sobre su propia reserva. El cliente lee lo suyo a través
-- de la vista my_trip_reservations de más abajo, que no expone admin_notes.
alter table public.trip_reservations enable row level security;
alter table public.trip_payments enable row level security;

create policy "trip_reservations_staff_all" on public.trip_reservations
  for all using (public.is_staff()) with check (public.is_staff());

create policy "trip_payments_staff_all" on public.trip_payments
  for all using (public.is_staff()) with check (public.is_staff());

-- ---------------------------------------------------------------- vista del cliente
-- Vista con semántica "security definer" (el dueño de la vista evita la RLS
-- de las tablas base) + filtro explícito por el usuario de la sesión. Expone
-- solo las columnas que el cliente puede ver (NO admin_notes) y trae los
-- pagos y los datos de la travesía embebidos. El cliente consulta ESTA vista,
-- nunca la tabla base.
create view public.my_trip_reservations
with (security_invoker = false) as
select
  r.id, r.trip_id, r.user_id, r.full_name, r.email, r.phone, r.participants,
  r.with_copilot, r.car_preference, r.message, r.status, r.currency, r.total_amount,
  r.options, r.public_notes, r.created_at, r.updated_at,
  coalesce((
    select jsonb_agg(
      jsonb_build_object(
        'id', p.id, 'reservation_id', p.reservation_id, 'amount', p.amount,
        'currency', p.currency, 'method', p.method, 'paid_at', p.paid_at,
        'reference', p.reference, 'note', p.note, 'created_by', null, 'created_at', p.created_at
      ) order by p.paid_at desc
    )
    from public.trip_payments p where p.reservation_id = r.id
  ), '[]'::jsonb) as payments,
  (
    select jsonb_build_object(
      'id', t.id, 'slug', t.slug, 'title', t.title, 'start_date', t.start_date,
      'end_date', t.end_date, 'cover_url', t.cover_url, 'cover_thumb_url', t.cover_thumb_url
    )
    from public.trips t where t.id = r.trip_id
  ) as trip
from public.trip_reservations r
where r.user_id = auth.uid()
   or lower(r.email) = lower(coalesce(auth.jwt() ->> 'email', ''));

comment on view public.my_trip_reservations is 'Vista de reservas para el cliente logueado (por user_id o email de la sesión). No expone admin_notes. El staff usa la tabla base.';

grant select on public.my_trip_reservations to anon, authenticated;
