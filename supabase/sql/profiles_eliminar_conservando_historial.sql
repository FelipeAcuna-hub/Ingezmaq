-- Ejecutar una vez en Supabase (SQL Editor), ANTES de publicar el cambio.
--
-- Eliminar a un cliente ahora solo le quita el acceso. Su perfil se conserva
-- marcado como eliminado, con sus archivos, tickets y movimientos. Si vuelve a
-- registrarse y se aprueba su cuenta nueva, se le traspasa ese historial.

-- La cuenta eliminada y la nueva conviven con el mismo correo/RUT. Si la tabla
-- lo prohibiera, el nuevo registro fallaría: mejor detenerse acá.
do $$
begin
  if exists (
    select 1
    from pg_index i
    join pg_attribute a on a.attrelid = i.indrelid and a.attnum = any (i.indkey)
    where i.indrelid = 'public.profiles'::regclass
      and i.indisunique
      and a.attname in ('email', 'rut')
  ) then
    raise exception 'profiles tiene un indice UNICO sobre email o rut: hay que ajustarlo antes de aplicar este cambio.';
  end if;
end;
$$;

alter table public.profiles
  add column if not exists eliminado_at timestamptz,
  add column if not exists eliminado_por text,
  add column if not exists historial_recuperado_en uuid;

-- Todo o nada: si falla un paso no queda el historial repartido entre cuentas.
create or replace function public.recuperar_historial_cliente(p_eliminado uuid, p_nuevo uuid)
returns void
language plpgsql
set search_path = public
as $$
declare
  creditos_anteriores public.profiles.credits%type;
begin
  select credits into creditos_anteriores
    from public.profiles
    where id = p_eliminado
      and eliminado_at is not null
      and historial_recuperado_en is null
    for update;

  if not found then
    raise exception 'La cuenta eliminada no existe o su historial ya fue recuperado.';
  end if;

  perform 1 from public.profiles where id = p_nuevo and eliminado_at is null for update;
  if not found then
    raise exception 'La cuenta nueva no existe o también está eliminada.';
  end if;

  update public.archivos set user_id = p_nuevo where user_id = p_eliminado;
  update public.tickets set user_id = p_nuevo where user_id = p_eliminado;
  update public.ticket_messages set user_id = p_nuevo where user_id = p_eliminado;
  update public.movimientos set user_id = p_nuevo where user_id = p_eliminado;
  update public.historial_movimientos set perfil_id = p_nuevo where perfil_id = p_eliminado;
  update public.pagos_mercadopago set user_id = p_nuevo where user_id = p_eliminado;

  update public.profiles
    set credits = coalesce(credits, 0) + coalesce(creditos_anteriores, 0)
    where id = p_nuevo;

  update public.profiles
    set credits = 0, historial_recuperado_en = p_nuevo
    where id = p_eliminado;
end;
$$;

-- Solo la función de servidor (clave de servicio) puede ejecutarla.
revoke all on function public.recuperar_historial_cliente(uuid, uuid) from public, anon, authenticated;
grant execute on function public.recuperar_historial_cliente(uuid, uuid) to service_role;
