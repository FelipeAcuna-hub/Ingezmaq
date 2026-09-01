-- Ejecutar en Supabase (SQL Editor).
-- Bloquea a nivel de base de datos que un usuario no aprobado (is_approved
-- distinto de true) pueda escribir NADA, sin importar si logra sesión por
-- fuera de la interfaz normal. Ocultar botones en el frontend no alcanza:
-- esto es lo que realmente lo impide.
--
-- Usa políticas RESTRICTIVAS: en RLS, TODAS las políticas restrictivas
-- deben cumplirse (se combinan con AND) sobre lo que ya permitan las
-- políticas normales/permisivas. No hace falta saber el nombre de ninguna
-- política existente ni reemplazarla — esta se suma como un candado extra.
--
-- Los admins quedan exceptuados (para que Admin.jsx y Clientes.jsx sigan
-- pudiendo aprobar/gestionar aunque el perfil objetivo no esté aprobado).

-- ==================== PROFILES ====================
-- Nadie puede actualizar un perfil (ni el propio) si is_approved no es true,
-- salvo los admins (que necesitan poder poner is_approved en true la
-- primera vez, y ajustar créditos de cualquiera).
alter table public.profiles enable row level security;

drop policy if exists "Restrictiva: solo aprobados modifican perfiles" on public.profiles;
create policy "Restrictiva: solo aprobados modifican perfiles"
  on public.profiles
  as restrictive
  for update
  using (
    is_approved = true
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  )
  with check (
    is_approved = true
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  );

-- ==================== ARCHIVOS ====================
-- Nadie puede subir un archivo si su propio perfil no está aprobado.
alter table public.archivos enable row level security;

drop policy if exists "Restrictiva: solo aprobados suben archivos" on public.archivos;
create policy "Restrictiva: solo aprobados suben archivos"
  on public.archivos
  as restrictive
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
  );

-- ==================== HISTORIAL_MOVIMIENTOS (canjes) ====================
alter table public.historial_movimientos enable row level security;

drop policy if exists "Restrictiva: solo aprobados registran canjes" on public.historial_movimientos;
create policy "Restrictiva: solo aprobados registran canjes"
  on public.historial_movimientos
  as restrictive
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  );

-- ==================== MOVIMIENTOS (recargas) ====================
alter table public.movimientos enable row level security;

drop policy if exists "Restrictiva: solo aprobados o admins registran recargas" on public.movimientos;
create policy "Restrictiva: solo aprobados o admins registran recargas"
  on public.movimientos
  as restrictive
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  );

-- ==================== TICKETS ====================
alter table public.tickets enable row level security;

drop policy if exists "Restrictiva: solo aprobados crean tickets" on public.tickets;
create policy "Restrictiva: solo aprobados crean tickets"
  on public.tickets
  as restrictive
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  );

-- ==================== TICKET_MESSAGES ====================
alter table public.ticket_messages enable row level security;

drop policy if exists "Restrictiva: solo aprobados responden tickets" on public.ticket_messages;
create policy "Restrictiva: solo aprobados responden tickets"
  on public.ticket_messages
  as restrictive
  for insert
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.is_approved = true
    )
    or (auth.jwt() ->> 'email') in (
      'sebastianzunigavaldivia@gmail.com',
      'oliver.zuniga@gmail.com',
      'focaldevs@gmail.com',
      'respaldoestudiovaldivia@gmail.com'
    )
  );
