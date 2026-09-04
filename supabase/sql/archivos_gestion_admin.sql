-- Ejecutar en Supabase (SQL Editor).
-- Guarda qué admin realizó cada gestión: quién puso la solicitud "en gestión"
-- y quién subió cada archivo devuelto al cliente (MOD, V2, V3). Antes solo
-- quedaba la fecha/hora, sin registrar el correo del admin responsable.
alter table public.archivos
  add column if not exists en_gestion_by text,
  add column if not exists mod_uploaded_by text,
  add column if not exists mod_extra_uploaded_by text,
  add column if not exists mod_v3_uploaded_by text;
