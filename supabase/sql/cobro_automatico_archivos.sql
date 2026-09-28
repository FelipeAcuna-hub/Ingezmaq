-- Ejecutar en Supabase (SQL Editor).
--
-- PROBLEMA DE FONDO: hace semanas que se vienen creando solicitudes en
-- "archivos" por una vía que no es el formulario de esta app (el texto de
-- sus registros de canje — "Canje Solicitud: ..." — no coincide con el que
-- genera UploadFile.jsx, y nunca trae el campo "servicio"). No se pudo
-- identificar qué es esa vía, pero tiene acceso directo a Supabase. Esa vía
-- SIEMPRE deja el registro del canje (historial_movimientos), pero MUCHAS
-- veces no descuenta los créditos reales del cliente (profiles.credits) —
-- ya van 94 créditos regalados entre 6 clientes reales por esto.
--
-- SOLUCIÓN: en vez de seguir dependiendo de que cada vía que crea una
-- solicitud también se acuerde de cobrar los créditos por su cuenta (que es
-- justo lo que sigue fallando), se mueve el cobro a la base de datos misma:
-- cada vez que se crea una fila en "archivos" con un costo, se descuenta
-- automáticamente — sin importar qué haya sido lo que creó esa fila (esta
-- app, o esa vía externa). Si el cliente no tiene saldo suficiente, la
-- solicitud directamente no se puede crear (en vez de crearse gratis).
--
-- Esto es un cambio importante: hay que sacar el descuento manual que hace
-- UploadFile.jsx (si no, un pedido hecho desde el formulario normal se
-- cobraría DOS veces). Ver el cambio correspondiente en el código.

-- 1) El trigger que protege profiles necesita dejar pasar el descuento que
--    hace ESTE trigger nuevo (que corre con la sesión de quien sea que
--    insertó el archivo, no con una cuenta de admin). Se usa una bandera de
--    transacción para distinguirlo de un intento real de auto-escalación.
create or replace function public.proteger_campos_privilegiados_profile()
returns trigger
language plpgsql
as $$
declare
  es_admin_completo boolean;
  puede_aprobar boolean;
  es_dueño boolean;
  es_cobro_automatico boolean;
begin
  es_admin_completo := auth.role() = 'service_role' or (auth.jwt() ->> 'email') in (
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  );

  puede_aprobar := es_admin_completo or (auth.jwt() ->> 'email') = 'alientechchile@gmail.com';
  es_cobro_automatico := coalesce(current_setting('app.cobro_automatico_archivo', true), 'false') = 'true';

  if TG_OP = 'UPDATE' then
    es_dueño := auth.uid() = old.id;

    if not (es_admin_completo or es_cobro_automatico) then
      new.credits := old.credits;
      new.cliente_especial := old.cliente_especial;
      new.descuento_porcentaje := old.descuento_porcentaje;
    end if;

    if not puede_aprobar then
      new.is_approved := old.is_approved;
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
    end if;

    if not (es_dueño or auth.role() = 'service_role') then
      new.full_name := old.full_name;
      new.apellido := old.apellido;
      new.phone := old.phone;
      new.company := old.company;
      new.rut := old.rut;
      new.actividad := old.actividad;
      new.country := old.country;
      new.fecha_nacimiento := old.fecha_nacimiento;
      new.email := old.email;
    end if;
  elsif TG_OP = 'INSERT' then
    if not es_admin_completo then
      new.credits := 0;
      new.cliente_especial := false;
      new.descuento_porcentaje := 0;
    end if;
    if not puede_aprobar then
      new.is_approved := false;
      new.approved_by := null;
      new.approved_at := null;
    end if;
  end if;

  return new;
end;
$$;

-- 2) El trigger que cobra automáticamente al crear una solicitud.
create or replace function public.cobrar_creditos_al_crear_archivo()
returns trigger
language plpgsql
as $$
declare
  costo numeric;
  creditos_actuales numeric;
begin
  costo := coalesce((new.detalles_tecnicos ->> 'costo_creditos')::numeric, 0);

  if costo <= 0 then
    return new;
  end if;

  select credits into creditos_actuales
    from public.profiles
    where id = new.user_id
    for update;

  if creditos_actuales is null then
    raise exception 'No se encontró el perfil del cliente (%) para cobrar los créditos.', new.user_id;
  end if;

  if creditos_actuales < costo then
    raise exception 'Saldo insuficiente: el cliente tiene % créditos y la solicitud cuesta %.', creditos_actuales, costo;
  end if;

  perform set_config('app.cobro_automatico_archivo', 'true', true);
  update public.profiles set credits = credits - costo where id = new.user_id;
  perform set_config('app.cobro_automatico_archivo', 'false', true);

  return new;
end;
$$;

drop trigger if exists trg_cobrar_creditos_al_crear_archivo on public.archivos;
create trigger trg_cobrar_creditos_al_crear_archivo
  after insert on public.archivos
  for each row
  execute function public.cobrar_creditos_al_crear_archivo();
