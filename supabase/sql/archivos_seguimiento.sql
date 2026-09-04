-- Ejecutar en Supabase (SQL Editor).
-- Datos de seguimiento técnico interno por solicitud: con qué programa se
-- modificó y qué centralita/ECU/TCU se usó. Se completan desde el botón
-- "Seguimiento" en Archivos.
alter table public.archivos
  add column if not exists programa_modificador text,
  add column if not exists centralita_ecu_tcu text;
