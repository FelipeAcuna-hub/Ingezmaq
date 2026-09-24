-- Ejecutar en Supabase (SQL Editor).
-- Ajusta el alcance de alientechchile@gmail.com en Storage: en el frontend
-- esa cuenta SOLO tiene acceso a Archivos y Clientes (ni Tickets ni
-- Administración — está documentado en Admin.jsx). Las políticas de
-- seguridad_auto_escalacion_y_storage.sql le daban permiso de escritura
-- también en el bucket "archivos-tickets", que nunca usa desde la interfaz.
-- Se separa el bucket de tickets (solo los 4 admins completos) del bucket de
-- vehículos (admins + alientechchile, que sí sube archivos MOD ahí).
drop policy if exists "Restrictiva: solo su carpeta o admin (INSERT)" on storage.objects;
create policy "Restrictiva: solo su carpeta o admin (INSERT)"
  on storage.objects
  as restrictive
  for insert
  with check (
    bucket_id not in ('archivos-vehiculos', 'archivos-tickets')
    or auth.role() = 'service_role'
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
    or (bucket_id = 'archivos-vehiculos' and (auth.jwt() ->> 'email') = 'alientechchile@gmail.com')
    or (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "Restrictiva: solo su carpeta o admin (UPDATE)" on storage.objects;
create policy "Restrictiva: solo su carpeta o admin (UPDATE)"
  on storage.objects
  as restrictive
  for update
  using (
    bucket_id not in ('archivos-vehiculos', 'archivos-tickets')
    or auth.role() = 'service_role'
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
    or (bucket_id = 'archivos-vehiculos' and (auth.jwt() ->> 'email') = 'alientechchile@gmail.com')
    or (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );

drop policy if exists "Restrictiva: solo su carpeta o admin (DELETE)" on storage.objects;
create policy "Restrictiva: solo su carpeta o admin (DELETE)"
  on storage.objects
  as restrictive
  for delete
  using (
    bucket_id not in ('archivos-vehiculos', 'archivos-tickets')
    or auth.role() = 'service_role'
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
    or (bucket_id = 'archivos-vehiculos' and (auth.jwt() ->> 'email') = 'alientechchile@gmail.com')
    or (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );
