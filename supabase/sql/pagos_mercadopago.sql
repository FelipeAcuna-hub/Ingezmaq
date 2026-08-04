-- Ejecutar una vez en Supabase (SQL Editor). Evita acreditar créditos dos veces
-- si MercadoPago reenvía la misma notificación de webhook.
create table if not exists public.pagos_mercadopago (
  id bigint generated always as identity primary key,
  mp_payment_id text not null unique,
  user_id uuid not null references public.profiles(id),
  credits integer not null,
  amount numeric not null,
  status text not null,
  created_at timestamptz not null default now()
);

alter table public.pagos_mercadopago enable row level security;

-- Solo el backend (service_role, que no pasa por RLS) escribe aquí.
-- Se permite lectura al propio usuario para que pueda ver su historial de pagos si hace falta.
create policy "Los usuarios ven sus propios pagos"
  on public.pagos_mercadopago
  for select
  using (auth.uid() = user_id);
