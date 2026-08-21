-- Ejecutar en Supabase (SQL Editor).
-- Habilita las notificaciones en tiempo real para "archivos" (y de paso
-- tickets/ticket_messages, que comparten el mismo canal en el código).
-- Sin esto, el código ya está suscrito a los cambios pero Supabase nunca
-- los envía, por eso el numerito del sidebar no se actualiza solo.
--
-- Usa DO blocks para que, si alguna tabla ya estaba agregada, no frene
-- al resto — simplemente avisa con NOTICE y sigue.
do $$
begin
  alter publication supabase_realtime add table public.archivos;
exception when duplicate_object then
  raise notice 'archivos ya estaba en la publicación de Realtime';
end $$;

do $$
begin
  alter publication supabase_realtime add table public.tickets;
exception when duplicate_object then
  raise notice 'tickets ya estaba en la publicación de Realtime';
end $$;

do $$
begin
  alter publication supabase_realtime add table public.ticket_messages;
exception when duplicate_object then
  raise notice 'ticket_messages ya estaba en la publicación de Realtime';
end $$;
