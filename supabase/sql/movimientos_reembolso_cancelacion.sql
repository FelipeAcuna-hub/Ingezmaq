-- Ejecutar en Supabase (SQL Editor).
-- Cuando un cliente cancela su propia solicitud "pendiente" en Archivos, se
-- le devuelven los créditos y el código intenta dejar un registro en
-- "movimientos" (tipo "carga", "Cancelación Solicitud: ...") para que los
-- admins lo vean en Créditos → Gestión global de recargas. Ese insert
-- siempre fallaba en silencio: la política de seguridad de movimientos solo
-- permite escribir a admins o al service_role, así que un cliente normal
-- nunca podía insertar ahí, ni siquiera para su propio reembolso.
--
-- Se agrega, como política adicional (no reemplaza nada existente), que un
-- usuario pueda insertar un movimiento de tipo "carga" para sí mismo. Esto
-- no abre ninguna puerta a manipular créditos de verdad: el campo
-- profiles.credits está protegido aparte (trigger
-- proteger_campos_privilegiados_profile), así que insertar acá es solo
-- dejar un registro/aviso, no cambia el saldo real de nadie.
drop policy if exists "El cliente registra su propia recarga (ej: reembolso al cancelar)" on public.movimientos;
create policy "El cliente registra su propia recarga (ej: reembolso al cancelar)"
  on public.movimientos
  for insert
  with check (
    auth.uid() = user_id and tipo = 'carga'
  );
