-- =========================
-- CONTROLE DE PONTO - SUPABASE SQL
-- Execute no SQL Editor do Supabase
-- =========================

create extension if not exists pgcrypto;

-- Limpeza opcional (descomente se precisar recriar do zero)
-- drop table if exists public.pontos cascade;
-- drop table if exists public.funcionarios cascade;

create table if not exists public.funcionarios (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique,
  nome text not null,
  email text not null unique,
  cargo text not null,
  trabalha_sabado boolean not null default false,
  admin boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.pontos (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.funcionarios (id) on delete cascade,
  data date not null,
  entrada time,
  inicio_intervalo time,
  fim_intervalo time,
  saida time,
  created_at timestamptz not null default now(),
  constraint pontos_funcionario_data_unique unique (funcionario_id, data)
);

create table if not exists public.escala_sabado_semanal (
  id uuid primary key default gen_random_uuid(),
  funcionario_id uuid not null references public.funcionarios (id) on delete cascade,
  semana_inicio date not null,
  trabalha_sabado boolean not null default false,
  created_at timestamptz not null default now(),
  constraint escala_sabado_func_semana_unique unique (funcionario_id, semana_inicio)
);

create index if not exists idx_pontos_data on public.pontos (data);
create index if not exists idx_pontos_funcionario_data on public.pontos (funcionario_id, data);
create index if not exists idx_escala_sabado_semana on public.escala_sabado_semanal (semana_inicio, funcionario_id);

-- =====================================
-- Funcoes auxiliares de autorizacao
-- =====================================

create or replace function public.meu_funcionario_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select f.id
  from public.funcionarios f
  where f.user_id = auth.uid()
  limit 1;
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.funcionarios f
    where f.user_id = auth.uid()
      and f.admin = true
  );
$$;

create or replace function public.agora_brasilia()
returns table(data date, hora time)
language sql
stable
security definer
set search_path = public
as $$
  select
    (now() at time zone 'America/Sao_Paulo')::date as data,
    (now() at time zone 'America/Sao_Paulo')::time(0) as hora;
$$;

grant execute on function public.meu_funcionario_id() to authenticated;
grant execute on function public.is_admin() to authenticated;
grant execute on function public.agora_brasilia() to authenticated;

-- =====================================
-- Row Level Security
-- =====================================

alter table public.funcionarios enable row level security;
alter table public.pontos enable row level security;
alter table public.escala_sabado_semanal enable row level security;

-- Remover politicas antigas (idempotente)
drop policy if exists "func_select_own_or_admin" on public.funcionarios;
drop policy if exists "func_insert_admin" on public.funcionarios;
drop policy if exists "func_update_admin" on public.funcionarios;
drop policy if exists "func_delete_admin" on public.funcionarios;

drop policy if exists "pontos_select_own_or_admin" on public.pontos;
drop policy if exists "pontos_insert_own_or_admin" on public.pontos;
drop policy if exists "pontos_update_own_or_admin" on public.pontos;
drop policy if exists "pontos_delete_admin" on public.pontos;

drop policy if exists "escala_select_own_or_admin" on public.escala_sabado_semanal;
drop policy if exists "escala_insert_admin" on public.escala_sabado_semanal;
drop policy if exists "escala_update_admin" on public.escala_sabado_semanal;
drop policy if exists "escala_delete_admin" on public.escala_sabado_semanal;

-- FUNCIONARIOS
create policy "func_select_own_or_admin"
  on public.funcionarios
  for select
  to authenticated
  using (
    user_id = auth.uid() or public.is_admin()
  );

create policy "func_insert_admin"
  on public.funcionarios
  for insert
  to authenticated
  with check (
    public.is_admin() or user_id = auth.uid()
  );

create policy "func_update_admin"
  on public.funcionarios
  for update
  to authenticated
  using (public.is_admin() or user_id = auth.uid())
  with check (public.is_admin() or user_id = auth.uid());

create policy "func_delete_admin"
  on public.funcionarios
  for delete
  to authenticated
  using (public.is_admin());

-- PONTOS
create policy "pontos_select_own_or_admin"
  on public.pontos
  for select
  to authenticated
  using (
    funcionario_id = public.meu_funcionario_id() or public.is_admin()
  );

create policy "pontos_insert_own_or_admin"
  on public.pontos
  for insert
  to authenticated
  with check (
    funcionario_id = public.meu_funcionario_id() or public.is_admin()
  );

create policy "pontos_update_own_or_admin"
  on public.pontos
  for update
  to authenticated
  using (
    funcionario_id = public.meu_funcionario_id() or public.is_admin()
  )
  with check (
    funcionario_id = public.meu_funcionario_id() or public.is_admin()
  );

create policy "pontos_delete_admin"
  on public.pontos
  for delete
  to authenticated
  using (public.is_admin());

-- ESCALA SABADO SEMANAL
create policy "escala_select_own_or_admin"
  on public.escala_sabado_semanal
  for select
  to authenticated
  using (
    funcionario_id = public.meu_funcionario_id() or public.is_admin()
  );

create policy "escala_insert_admin"
  on public.escala_sabado_semanal
  for insert
  to authenticated
  with check (public.is_admin());

create policy "escala_update_admin"
  on public.escala_sabado_semanal
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy "escala_delete_admin"
  on public.escala_sabado_semanal
  for delete
  to authenticated
  using (public.is_admin());

-- Grants basicos
grant usage on schema public to authenticated;
grant select, insert, update, delete on public.funcionarios to authenticated;
grant select, insert, update, delete on public.pontos to authenticated;
grant select, insert, update, delete on public.escala_sabado_semanal to authenticated;

-- =====================================
-- Bootstrap do primeiro admin (executar manualmente)
-- 1) Crie um usuario em Authentication > Users
-- 2) Pegue o UUID e execute algo como:
-- insert into public.funcionarios (
--   user_id, nome, email, cargo, trabalha_sabado, admin
-- ) values (
--   'UUID_DO_AUTH_USER', 'Administrador', 'admin@empresa.com', 'Admin', false, true
-- );
-- =====================================
