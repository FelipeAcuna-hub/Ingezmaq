-- Ejecutar una vez en Supabase (SQL Editor).
-- Agrega el campo de fecha de cumpleaños al perfil del cliente.
alter table public.profiles
  add column if not exists fecha_nacimiento date;
