-- Ejecutar una vez en Supabase (SQL Editor), ANTES de publicar el cambio:
-- la compra de créditos lee esta columna y, si no existe, no deja comprar a nadie.
--
-- Marca a los clientes a los que se les cobra IVA (19%) al comprar créditos.
alter table public.profiles
  add column if not exists paga_iva boolean not null default false;

-- Solo un admin completo puede cambiarla. Sin esto, el propio cliente podría
-- desmarcarse para no pagar IVA. Es la misma función de
-- cobro_automatico_archivos.sql, agregando paga_iva a los campos protegidos.
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
      new.paga_iva := old.paga_iva;
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
      new.paga_iva := false;
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
