# Travesías — etapa 2 (reservas, activación y ajustes)

Ampliación del módulo de Travesías sobre lo de la etapa 1. Resumen de lo que cambió y cómo funciona.

## Activación en el sitio (dos niveles)
- **A nivel sitio** (Configuración → Travesías → "Mostrar Travesías en la web",
  `site_settings.travesias_enabled`, default activado): decide si el ítem "Travesías" aparece
  en el **menú** y si aparece la **sección Travesías en la home**. Si se desactiva, no aparece
  ninguno de los dos, aunque haya travesías publicadas.
- **A nivel de cada travesía** (`trips.status` publicada / borrador / oculta): decide si esa
  travesía se muestra en la sección pública. En el admin, "Travesías" y todas las travesías
  están **siempre** visibles (publicadas o no).
- En el admin: `Configuración` tiene el interruptor de sitio; cada travesía tiene Publicar /
  Pasar a borrador.

## Precio oculto por defecto
- La página pública **no muestra importes**: ni el precio base (dice "Tu lugar, a medida" y
  lleva a consultar), ni los precios de los opcionales ("Consultar"). El precio interno se
  guarda igual en la travesía y sirve para proponer el total de una reserva.
- Cada travesía tiene un interruptor `show_price` (default: apagado) por si en algún caso se
  quiere publicar el precio.

## Lugar geográfico por día → mapa
- El mapa del recorrido ya no usa una lista de paradas aparte: se arma con el **lugar de cada
  día** (`trip_days.place_name/place_lat/place_lng`), que se carga en el formulario del día.
- Días sin lugar no figuran en el mapa (ej. un día que no se mueve de la ciudad). Los lugares
  muy cercanos entre sí (misma ciudad en días distintos) se agrupan en un punto con los días
  combinados, para que el mapa no quede amontonado.
- Cada día tiene además foto principal **y** complementaria.

## Llamado a la acción = consulta (no reserva automática)
- El botón de la landing manda una **consulta** a la bandeja **Mensajes**
  (`contact_messages`, asunto "Consulta Travesía: …"), con participantes, copiloto, auto
  preferido y opcionales de interés. No crea una reserva.
- Desde Mensajes, el staff crea la reserva en **/admin/reservas**.

## Reservas y pagos (admin)
- **/admin/reservas**: listado con cliente, travesía, estado (cambiable desde la lista), total,
  saldo y alta. KPI "Reservas solicitadas" en el dashboard.
- **/admin/reservas/nueva** y **/admin/reservas/[id]**: alta y gestión completa — estado
  (solicitada, lista de espera, confirmada, señada, pagada, cancelada), total acordado, moneda,
  opcionales, **notas públicas** (las ve el cliente) y **notas internas** (solo staff), y
  **pagos** (monto, medio, fecha, referencia, nota). El saldo se calcula (total − pagos).
- Las reservas se vinculan al cliente por **email**: cuando la persona se registra con ese mismo
  email, ve su reserva.

## Vista del cliente registrado
- En **Mi cuenta** aparece "Mis travesías" (estado y saldo) y el detalle en
  **/cuenta/reservas/[id]**: total, pagado, saldo, opcionales, pagos y **notas públicas**.
- El cliente **nunca** ve las notas internas: lee a través de la vista `my_trip_reservations`
  (filtra por su user_id o email y no expone `admin_notes`); las tablas base son solo-staff.

## Base de datos
- `supabase/migrations/0023_trips.sql` (actualizada): `trips` sin `show_in_menu`/`stops`, con
  `show_price`; `trip_days` con `place_name/place_lat/place_lng`; carga inicial con lugares por
  día y 2ª foto en todos los días.
- `supabase/migrations/0024_trip_reservations.sql` (nueva): `trip_reservations` y
  `trip_payments` (solo-staff en las tablas base), la vista `my_trip_reservations` para el
  cliente, y la fila `site_settings.travesias_enabled = true`.
- **Aplicar ambas** (`supabase db push` o SQL Editor) para que funcione contra Supabase real.

## Verificación
- `tsc --noEmit`, `next lint` y `next build` pasan. Las pantallas públicas y de admin se
  revisaron renderizadas en modo demo (sin Supabase).
- Recordatorio de la etapa 1: hacé `npm install` limpio; el `node_modules` del repo estaba
  incompleto.
