-- Ejecutar una vez en Supabase (SQL Editor).
-- Marca clientes que acceden a precios especiales fijos en ciertos servicios
-- (DPF OFF, EGR OFF, DPF+EGR OFF, DPF+EGR+ADBLUE OFF).
alter table public.profiles
  add column if not exists cliente_especial boolean not null default false;
