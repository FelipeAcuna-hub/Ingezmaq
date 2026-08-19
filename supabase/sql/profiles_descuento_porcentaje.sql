-- Ejecutar una vez en Supabase (SQL Editor).
-- Descuento porcentual (0-100) aplicado al costo en créditos de los servicios
-- (STAGE 1, STAGE 2, etc.) para clientes específicos. 0 = sin descuento.
alter table public.profiles
  add column if not exists descuento_porcentaje integer not null default 0
  check (descuento_porcentaje >= 0 and descuento_porcentaje <= 100);
