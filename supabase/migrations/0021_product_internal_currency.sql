-- Moneda de "Precio producto" (cost_price) en la sección "Información
-- interna (solo admin)" de cada producto. Hasta ahora esa sección asumía
-- implícitamente que todo estaba en USD (así lo decía el comentario de
-- cost_price y las etiquetas del form), pero el precio público del
-- producto (products.currency) puede ser ARS o USD — si difieren, la
-- advertencia de "precio por debajo del costo" comparaba números crudos de
-- distinta moneda como si fueran lo mismo. Con este campo se puede saber
-- cuándo hace falta convertir (con el dólar blue, ver
-- src/actions/dolar.ts y ProductForm.tsx) antes de comparar.
alter table public.product_internal_info
  add column currency text not null default 'USD' check (currency in ('ARS', 'USD'));

comment on column public.product_internal_info.currency is
  'Moneda de "Precio producto" (cost_price). El costo de envío (shipping_cost = peso × 45) sigue siendo un proxy fijo pensado en USD: si currency = ARS, ese envío no se re-convierte automáticamente acá (columna generada, no puede pedir una cotización en vivo) — la comparación currency-aware real contra el precio público vive en el cliente, en ProductForm.tsx.';
