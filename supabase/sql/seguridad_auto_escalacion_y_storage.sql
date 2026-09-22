-- Ejecutar en Supabase (SQL Editor).
-- Corrige dos filtraciones de seguridad reales, confirmadas con una prueba
-- activa (dos cuentas de prueba desechables, usando la misma llave pública
-- que usa el navegador, sin ningún acceso especial):
--
-- 1) Cualquier cliente logueado podía, desde la consola del navegador,
--    hacer supabase.from('profiles').update({ credits: 999999, is_approved:
--    true, cliente_especial: true }).eq('id', suPropioId) y la base lo
--    aceptaba: se daba créditos infinitos, se auto-aprobaba sin admin, y se
--    marcaba "cliente especial" (precios fijos más bajos) él mismo. La
--    política de RLS solo controlaba QUÉ FILA se puede tocar (auth.uid() =
--    id), no QUÉ COLUMNAS. Confirmado que SÍ estaba bloqueado modificar la
--    fila de OTRO usuario, y que la tabla completa no se podía leer sin
--    filtro — el problema era únicamente la auto-escalación en su propia fila.
--
-- 2) Cualquier cliente logueado podía subir (y pisar) archivos en la carpeta
--    de Storage de OTRO usuario, en los buckets archivos-vehiculos y
--    archivos-tickets (ej: supabase.storage.from('archivos-vehiculos')
--    .upload('idDeOtroCliente/carpeta/archivo', archivoMalicioso)). Esto es
--    justamente "modificar archivos" de otra persona: alguien podría
--    reemplazar el archivo modificado (mod_file_url) que un cliente está por
--    descargar, por uno corrupto o malicioso.
--
-- Ambas se corrigen agregando candados extra (políticas RESTRICTIVAS), sin
-- tocar ni necesitar saber el nombre de las políticas que ya existen.

-- ==========================================================================
-- 1) PROFILES: nadie (salvo admins y el propio backend) puede cambiar
--    credits / is_approved / cliente_especial / descuento_porcentaje de SU
--    PROPIA fila. Se usa un trigger (no una política RLS) porque RLS no
--    puede restringir columnas específicas, solo filas completas.
-- ==========================================================================
create or replace function public.proteger_campos_privilegiados_profile()
returns trigger
language plpgsql
as $$
declare
  es_privilegiado boolean;
begin
  -- service_role = Netlify Functions (mp-webhook, create-preference, delete-client),
  -- que sí necesitan poder cambiar estos campos (acreditar pagos, etc).
  -- El email del admin = cuando un admin ajusta manualmente desde Admin.jsx/Clientes.jsx.
  es_privilegiado := auth.role() = 'service_role' or (auth.jwt() ->> 'email') in (
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  );

  if es_privilegiado then
    return new;
  end if;

  if TG_OP = 'UPDATE' then
    -- No es admin ni el backend: estos 4 campos quedan tal cual estaban,
    -- sin importar qué haya mandado la consulta.
    new.credits := old.credits;
    new.is_approved := old.is_approved;
    new.cliente_especial := old.cliente_especial;
    new.descuento_porcentaje := old.descuento_porcentaje;
  elsif TG_OP = 'INSERT' then
    -- Por si alguien intenta crear su perfil ya "aprobado" o con créditos,
    -- saltándose el insert normal del registro (Login.jsx).
    new.credits := 0;
    new.is_approved := false;
    new.cliente_especial := false;
    new.descuento_porcentaje := 0;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_proteger_campos_privilegiados on public.profiles;
create trigger trg_proteger_campos_privilegiados
  before insert or update on public.profiles
  for each row
  execute function public.proteger_campos_privilegiados_profile();

-- ==========================================================================
-- 2) STORAGE: solo se puede escribir (subir/reemplazar/borrar) dentro de la
--    propia carpeta (primer segmento del path = el propio user id), salvo
--    admins y el backend. El bucket sigue siendo público para LECTURA (así
--    funcionan los links de descarga), esto solo restringe la ESCRITURA.
-- ==========================================================================
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
      'respaldoestudiovaldivia@gmail.com',
      'alientechchile@gmail.com'
    )
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
      'respaldoestudiovaldivia@gmail.com',
      'alientechchile@gmail.com'
    )
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
      'respaldoestudiovaldivia@gmail.com',
      'alientechchile@gmail.com'
    )
    or (
      (storage.foldername(name))[1] ~ '^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}$'
      and (storage.foldername(name))[1] = auth.uid()::text
    )
  );
