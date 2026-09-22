-- Ejecutar en Supabase (SQL Editor).
-- Guarda el servicio realizado (ej: "DPF OFF", "Stage 1", etc.) como su
-- propio campo en cada canje, en vez de tener que extraerlo del texto libre
-- de "descripcion". Se completa desde UploadFile.jsx al hacer el canje.
alter table public.historial_movimientos
  add column if not exists servicio text;
