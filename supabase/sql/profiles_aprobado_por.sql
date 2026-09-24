-- Ejecutar en Supabase (SQL Editor). Reemplaza por completo la versión
-- anterior de este mismo archivo.
--
-- Guarda quién aprobó a cada cliente y cuándo (approved_by / approved_at),
-- completado desde Clientes.jsx al aprobar.
--
-- Además cierra dos huecos encontrados al revisar el alcance real de
-- alientechchile@gmail.com (cuya función es: subir archivos/instrucciones a
-- clientes desde Archivos, y aprobar/rechazar/eliminar clientes — nada más):
--
-- 1) El trigger de profiles solo dejaba pasar cambios de los 4 admins
--    completos; sin alientechchile, aprobar quedaba revertido en silencio.
--    Se agrega, pero SOLO para is_approved/approved_by/approved_at — sigue
--    sin poder tocar credits/cliente_especial/descuento_porcentaje.
--
-- 2) La política "Gestion de clientes: update" (profiles_clientes_access.sql)
--    permite, a nivel de RLS, editar CUALQUIER columna de CUALQUIER perfil
--    (no solo is_approved) a los 4 admins completos Y a alientechchile —
--    incluyendo nombre, teléfono, email, empresa, rut, etc. Ninguna pantalla
--    de la app edita esos datos de otro usuario hoy (Perfil.jsx solo permite
--    editar el propio). Se extiende el mismo trigger para que esos campos
--    de contacto solo los pueda cambiar el propio dueño del perfil o el
--    backend (service_role) — ningún admin, sin importar qué se le mande
--    directamente a la base saltándose la interfaz.
alter table public.profiles
  add column if not exists approved_by text,
  add column if not exists approved_at timestamptz;

create or replace function public.proteger_campos_privilegiados_profile()
returns trigger
language plpgsql
as $$
declare
  es_admin_completo boolean;
  puede_aprobar boolean;
  es_dueño boolean;
begin
  es_admin_completo := auth.role() = 'service_role' or (auth.jwt() ->> 'email') in (
    'sebastianzunigavaldivia@gmail.com',
    'oliver.zuniga@gmail.com',
    'focaldevs@gmail.com',
    'respaldoestudiovaldivia@gmail.com'
  );

  puede_aprobar := es_admin_completo or (auth.jwt() ->> 'email') = 'alientechchile@gmail.com';

  if TG_OP = 'UPDATE' then
    es_dueño := auth.uid() = old.id;

    if not es_admin_completo then
      new.credits := old.credits;
      new.cliente_especial := old.cliente_especial;
      new.descuento_porcentaje := old.descuento_porcentaje;
    end if;

    if not puede_aprobar then
      new.is_approved := old.is_approved;
      new.approved_by := old.approved_by;
      new.approved_at := old.approved_at;
    end if;

    -- Datos de contacto: solo el dueño del perfil (o el backend) los cambia.
    -- Ni siquiera un admin completo los toca desde ninguna función actual.
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
