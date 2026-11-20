-- Ejecutar una vez en Supabase (SQL Editor), ANTES de publicar el cambio de Perfil.jsx:
-- esa página guarda estos campos y, si las columnas no existen, Supabase rechaza
-- todo el guardado del perfil.
--
-- Agrega al perfil el tipo de documento tributario y los datos para emitir factura.
alter table public.profiles
  add column if not exists tipo_documento text not null default 'boleta'
    check (tipo_documento in ('boleta', 'factura')),
  add column if not exists razon_social text,
  add column if not exists rut_facturacion text,
  add column if not exists giro text,
  add column if not exists direccion_comercial text,
  add column if not exists comuna text,
  add column if not exists ciudad text,
  add column if not exists correo_facturacion text;
