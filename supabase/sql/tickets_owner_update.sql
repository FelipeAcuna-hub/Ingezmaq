-- Ejecutar en Supabase (SQL Editor).
-- Permite que cada cliente actualice sus propios tickets (necesario para
-- que pueda archivarlos). Es una política adicional: si ya existía una
-- que permitía esto (o una de admins), no se pisa, solo se suma.
alter table public.tickets enable row level security;

drop policy if exists "Dueño actualiza su propio ticket" on public.tickets;
create policy "Dueño actualiza su propio ticket"
  on public.tickets
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
