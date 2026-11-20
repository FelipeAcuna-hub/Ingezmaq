-- Ejecutar una vez en Supabase (SQL Editor), ANTES de publicar el cambio.
--
-- Contraseña para descargar el informe de archivos ("Descargar info archivos"
-- y los botones del mes). Se guarda solo su hash (no se puede leer de vuelta)
-- en una tabla que nadie puede consultar desde la página; la verificación la
-- hace la base de datos con la función de abajo.

create extension if not exists pgcrypto with schema extensions;

create table if not exists public.claves_protegidas (
  nombre text primary key,
  hash text not null,
  actualizada_at timestamptz not null default now()
);

-- RLS activo y sin políticas: ninguna cuenta puede leerla ni escribirla desde la página.
alter table public.claves_protegidas enable row level security;
revoke all on table public.claves_protegidas from anon, authenticated;

create or replace function public.verificar_clave_informe(p_clave text)
returns boolean
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  hash_guardado text;
begin
  if lower(coalesce(auth.jwt() ->> 'email', '')) not in (
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  ) then
    raise exception 'No tienes permisos para descargar el informe.';
  end if;

  select hash into hash_guardado from public.claves_protegidas where nombre = 'informe_archivos';
  if hash_guardado is null then
    raise exception 'Aún no se ha configurado la contraseña del informe.';
  end if;

  return extensions.crypt(coalesce(p_clave, ''), hash_guardado) = hash_guardado;
end;
$$;

revoke all on function public.verificar_clave_informe(text) from public, anon;
grant execute on function public.verificar_clave_informe(text) to authenticated;

-- PARA PONER O CAMBIAR LA CONTRASEÑA: ejecuta aparte esta consulta en el SQL
-- Editor, reemplazando TU_CONTRASEÑA (no la guardes en este archivo):
--
-- insert into public.claves_protegidas (nombre, hash)
-- values ('informe_archivos', extensions.crypt('TU_CONTRASEÑA', extensions.gen_salt('bf')))
-- on conflict (nombre) do update set hash = excluded.hash, actualizada_at = now();
