-- Ejecutar una vez en Supabase (SQL Editor).
-- Permite a los admins archivar tickets para sacarlos de la vista principal.
alter table public.tickets
  add column if not exists archivado boolean not null default false;
