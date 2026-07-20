-- Datos opcionales adicionales de perfil: documento de identidad y una
-- dirección de envío guardada, para no tener que volver a tipearla en cada
-- pedido. Todo nullable: nada de esto es obligatorio para tener una cuenta.
alter table public.profiles
  add column document_number text,
  add column shipping_street text,
  add column shipping_city text,
  add column shipping_province text,
  add column shipping_postal_code text;

comment on column public.profiles.document_number is 'DNI/CUIT u otro documento de identidad, opcional.';
