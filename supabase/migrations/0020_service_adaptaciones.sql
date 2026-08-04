-- Fantasma Garage — Servicios: renombrar "Mecánica" a "Adaptaciones"
-- Pedido del smoke test: mismo servicio (slug 'mecanica' del seed), nuevo
-- título y descripción. Es un UPDATE de datos, no de esquema — si el
-- servicio ya fue editado a mano desde /admin/servicios con otro slug, este
-- UPDATE simplemente no encuentra fila y no hace nada (no falla).

update public.services
set
  slug = 'adaptaciones',
  title = 'Adaptaciones',
  description = 'Motores, transmisión, aire acondicionados, frenos, suspensión, etc.'
where slug = 'mecanica' or title = 'Mecánica';
