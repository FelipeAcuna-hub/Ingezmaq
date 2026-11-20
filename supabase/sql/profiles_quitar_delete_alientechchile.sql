-- Ejecutar en Supabase (SQL Editor).
-- Quita a alientechchile@gmail.com de la política que permite borrar filas de
-- profiles directamente. Reemplaza la política creada en
-- profiles_clientes_access.sql; no volver a ejecutar ese archivo después de este.
--
-- Rechazar solicitudes sigue funcionando: pasa por la función de servidor
-- delete-client, que usa la clave de servicio y solo le permite a
-- alientechchile borrar solicitudes pendientes.

drop policy if exists "Gestion de clientes: delete" on public.profiles;
create policy "Gestion de clientes: delete"
  on public.profiles
  for delete
  using (
    (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  );
