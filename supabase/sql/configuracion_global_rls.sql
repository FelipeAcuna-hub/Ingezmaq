-- Ejecutar en Supabase (SQL Editor). Permite que los admins actualicen el
-- estado global del banner (is_online: 'auto' | 'manual_off'). Si la tabla
-- solo tenía política de lectura, el UPDATE desde Admin.jsx fallaba en
-- silencio (RLS lo bloqueaba) y el banner nunca reflejaba el cambio.

alter table public.configuracion_global enable row level security;

-- Lectura abierta: el banner se muestra también a usuarios no logueados.
drop policy if exists "Lectura pública de configuración" on public.configuracion_global;
create policy "Lectura pública de configuración"
  on public.configuracion_global
  for select
  using (true);

-- Escritura solo para los admins (mismo criterio que ADMIN_EMAILS en el frontend).
drop policy if exists "Admins actualizan configuración global" on public.configuracion_global;
create policy "Admins actualizan configuración global"
  on public.configuracion_global
  for update
  using (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  )
  with check (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
    or (auth.jwt() -> 'user_metadata' ->> 'role') = 'admin'
  );
