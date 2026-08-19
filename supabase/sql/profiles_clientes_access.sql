-- Ejecutar en Supabase (SQL Editor).
-- Permite a los admins completos y a alientechchile@gmail.com aprobar,
-- rechazar (is_approved) y eliminar perfiles desde /clientes.
--
-- Se agregan como políticas adicionales: en RLS, si CUALQUIER política
-- permisiva otorga acceso, se permite. No reemplaza ni borra políticas
-- que ya existan sobre esta tabla.

alter table public.profiles enable row level security;

drop policy if exists "Gestion de clientes: update" on public.profiles;
create policy "Gestion de clientes: update"
  on public.profiles
  for update
  using (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'alientechchile@gmail.com'
    )
  )
  with check (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'alientechchile@gmail.com'
    )
  );

drop policy if exists "Gestion de clientes: delete" on public.profiles;
create policy "Gestion de clientes: delete"
  on public.profiles
  for delete
  using (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'alientechchile@gmail.com'
    )
  );

-- Por si la tabla no tuviera aún una política de lectura amplia para
-- admins (necesaria para listar TODOS los clientes, no solo el propio).
drop policy if exists "Gestion de clientes: select" on public.profiles;
create policy "Gestion de clientes: select"
  on public.profiles
  for select
  using (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'alientechchile@gmail.com'
    )
  );
