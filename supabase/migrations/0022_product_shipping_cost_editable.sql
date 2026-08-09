-- El costo de envío era 100% automático (peso × 45 USD, proxy pensado
-- para importaciones desde EE.UU.), pero no todos los productos se compran
-- así: productos de origen argentino u otro origen pueden tener un costo
-- de envío bien distinto, o ninguno. shipping_cost pasa de columna
-- calculada a columna editable — el formulario (ver ProductForm.tsx)
-- lo sigue sugiriendo automáticamente como peso × 45 USD apenas se carga
-- el peso, pero el admin puede pisar ese valor a mano en cualquier momento.
alter table public.product_internal_info
  alter column shipping_cost drop expression;

comment on column public.product_internal_info.shipping_cost is
  'Costo de envío. El formulario lo sugiere automáticamente como peso × 45 USD apenas se carga el peso, pero es editable a mano — pensado para productos que no siguen esa fórmula (ej. de origen argentino).';

-- total_cost y suggested_price recalculaban peso × 45 por su cuenta en vez
-- de usar shipping_cost: si el admin pisaba el costo de envío, no se veía
-- reflejado en estas dos. Postgres no permite editar in place la expresión
-- de una columna generada, así que se recrean apuntando a shipping_cost.
alter table public.product_internal_info drop column total_cost;
alter table public.product_internal_info drop column suggested_price;

alter table public.product_internal_info
  add column total_cost numeric(12, 2) generated always as (
    round(coalesce(cost_price, 0) + coalesce(shipping_cost, 0), 2)
  ) stored;

alter table public.product_internal_info
  add column suggested_price numeric(12, 2) generated always as (
    round(coalesce(cost_price, 0) * 1.12 + coalesce(shipping_cost, 0) * 1.5, 2)
  ) stored;

comment on column public.product_internal_info.total_cost is 'Calculado: cost_price + shipping_cost.';
comment on column public.product_internal_info.suggested_price is 'Calculado: cost_price × 1.12 + shipping_cost × 1.5.';
