-- Ejecutar en Supabase (SQL Editor).
-- Permite que un usuario recién registrado cree su propia fila en profiles.
-- Sin esto, el INSERT que hace Login.jsx al registrarse siempre fallaba por
-- RLS (antes en silencio; ahora se nota, por eso "No se pudo completar tu
-- registro... row-level security policy").
drop policy if exists "El usuario crea su propio perfil" on public.profiles;
create policy "El usuario crea su propio perfil"
  on public.profiles
  for insert
  with check (auth.uid() = id);
