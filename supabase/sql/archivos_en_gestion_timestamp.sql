-- Ejecutar en Supabase (SQL Editor).
-- Guarda la fecha/hora exacta en que una solicitud pasó a estado "en gestión",
-- para que el informe descargable en Archivos pueda mostrarla. Antes solo se
-- guardaba created_at (hora de la solicitud) y las horas de entrega de cada
-- archivo (mod_uploaded_at, etc.), pero no este paso intermedio.
alter table public.archivos
  add column if not exists en_gestion_at timestamptz;
