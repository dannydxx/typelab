-- 16型恋爱人格测试：完整数据库结构
-- 在 Supabase SQL Editor 中一次性执行。本文件可重复用于新项目初始化。

create extension if not exists pgcrypto;

do $$ begin
  create type public.redeem_code_status as enum ('unused', 'active', 'expired', 'disabled');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.test_attempt_status as enum ('started', 'completed', 'abandoned');
exception when duplicate_object then null;
end $$;

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.code_batches (
  id text primary key,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  notes text
);

create table if not exists public.redeem_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^LOVE-[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$'),
  status public.redeem_code_status not null default 'unused',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  activated_at timestamptz,
  expires_at timestamptz,
  completed_count integer not null default 0 check (completed_count >= 0),
  max_completed_count integer not null default 3 check (max_completed_count > 0),
  last_used_at timestamptz,
  exported_at timestamptz,
  notes text,
  batch_id text not null references public.code_batches(id) on delete restrict
);

create table if not exists public.redeem_sessions (
  id uuid primary key default gen_random_uuid(),
  redeem_code_id uuid not null references public.redeem_codes(id) on delete cascade,
  token_hash text not null unique,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);

create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  redeem_code_id uuid not null references public.redeem_codes(id) on delete restrict,
  status public.test_attempt_status not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.test_attempts(id) on delete restrict,
  redeem_code_id uuid not null references public.redeem_codes(id) on delete restrict,
  personality_type text not null check (personality_type ~ '^(0[1-9]|1[0-6])$'),
  dimension_scores jsonb not null check (
    dimension_scores ?& array['security', 'closeness', 'expression', 'conflict']
  ),
  completed_at timestamptz not null default now()
);

create index if not exists redeem_codes_status_idx on public.redeem_codes(status);
create index if not exists redeem_codes_batch_idx on public.redeem_codes(batch_id);
create index if not exists redeem_codes_expires_idx on public.redeem_codes(expires_at) where status = 'active';
create index if not exists redeem_sessions_code_idx on public.redeem_sessions(redeem_code_id);
create index if not exists redeem_sessions_expires_idx on public.redeem_sessions(expires_at);
create index if not exists test_attempts_code_idx on public.test_attempts(redeem_code_id);
create index if not exists test_results_type_idx on public.test_results(personality_type);
create index if not exists test_results_completed_idx on public.test_results(completed_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists redeem_codes_set_updated_at on public.redeem_codes;
create trigger redeem_codes_set_updated_at
before update on public.redeem_codes
for each row execute function public.set_updated_at();

create or replace function public.create_code_batch(p_created_by uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_date text := to_char(timezone('Asia/Shanghai', now()), 'YYYYMMDD');
  v_sequence integer;
  v_id text;
begin
  perform pg_advisory_xact_lock(hashtext('code-batch-' || v_date));
  select count(*) + 1 into v_sequence from public.code_batches where id like v_date || '-%';
  v_id := v_date || '-' || lpad(v_sequence::text, 3, '0');
  insert into public.code_batches(id, created_by) values (v_id, p_created_by);
  return v_id;
end;
$$;

create or replace function public.refresh_expired_codes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.redeem_codes
  set status = 'expired'
  where status = 'active' and expires_at <= now();
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.redeem_code(p_code text, p_valid_hours integer default 24)
returns table (
  code_id uuid,
  state public.redeem_code_status,
  activated_at timestamptz,
  expires_at timestamptz,
  completed_count integer,
  max_completed_count integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.redeem_codes%rowtype;
begin
  select * into v_code
  from public.redeem_codes
  where code = upper(trim(p_code))
  for update;

  if not found then return; end if;

  if v_code.status = 'active' and v_code.expires_at <= now() then
    update public.redeem_codes set status = 'expired' where id = v_code.id returning * into v_code;
  elsif v_code.status = 'unused' then
    update public.redeem_codes
      set status = 'active', activated_at = now(), expires_at = now() + make_interval(hours => p_valid_hours), last_used_at = now()
      where id = v_code.id returning * into v_code;
  elsif v_code.status = 'active' then
    update public.redeem_codes set last_used_at = now() where id = v_code.id returning * into v_code;
  end if;

  return query select v_code.id, v_code.status, v_code.activated_at, v_code.expires_at, v_code.completed_count, v_code.max_completed_count;
end;
$$;

create or replace function public.start_test_attempt(p_code_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.redeem_codes%rowtype;
  v_attempt_id uuid;
begin
  select * into v_code from public.redeem_codes where id = p_code_id for update;
  if not found then raise exception 'CODE_NOT_FOUND'; end if;
  if v_code.status = 'disabled' then raise exception 'CODE_DISABLED'; end if;
  if v_code.status <> 'active' or v_code.expires_at <= now() then
    update public.redeem_codes set status = 'expired' where id = p_code_id and status = 'active';
    raise exception 'CODE_EXPIRED';
  end if;
  if v_code.completed_count >= v_code.max_completed_count then raise exception 'LIMIT_REACHED'; end if;

  insert into public.test_attempts(redeem_code_id) values (p_code_id) returning id into v_attempt_id;
  return v_attempt_id;
end;
$$;

create or replace function public.complete_test_attempt(
  p_code_id uuid,
  p_attempt_id uuid,
  p_personality_type text,
  p_dimension_scores jsonb
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_attempt public.test_attempts%rowtype;
  v_code public.redeem_codes%rowtype;
begin
  select * into v_attempt from public.test_attempts
  where id = p_attempt_id and redeem_code_id = p_code_id for update;
  if not found then raise exception 'ATTEMPT_INVALID'; end if;
  if v_attempt.status = 'completed' then return false; end if;

  select * into v_code from public.redeem_codes where id = p_code_id for update;
  if v_code.status = 'disabled' then raise exception 'CODE_DISABLED'; end if;
  if v_code.status <> 'active' or v_code.expires_at <= now() then raise exception 'CODE_EXPIRED'; end if;
  if v_code.completed_count >= v_code.max_completed_count then raise exception 'LIMIT_REACHED'; end if;

  update public.test_attempts set status = 'completed', completed_at = now() where id = p_attempt_id;
  insert into public.test_results(attempt_id, redeem_code_id, personality_type, dimension_scores)
  values (p_attempt_id, p_code_id, p_personality_type, p_dimension_scores);
  update public.redeem_codes
  set completed_count = completed_count + 1, last_used_at = now()
  where id = p_code_id;
  return true;
end;
$$;

create or replace view public.code_batch_summary
with (security_invoker = true)
as
select
  b.id as batch_id,
  b.created_at,
  count(c.id)::integer as total_count,
  count(c.id) filter (where c.status = 'unused')::integer as unused_count,
  max(c.exported_at) as last_exported_at
from public.code_batches b
left join public.redeem_codes c on c.batch_id = b.id
group by b.id, b.created_at;

alter table public.admin_profiles enable row level security;
alter table public.code_batches enable row level security;
alter table public.redeem_codes enable row level security;
alter table public.redeem_sessions enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_results enable row level security;

-- 默认不建立 anon/authenticated 策略：浏览器无法直接读取或修改业务表。
-- 所有业务写入都由受控服务端 API 使用 service_role 完成。
revoke all on public.admin_profiles, public.code_batches, public.redeem_codes, public.redeem_sessions, public.test_attempts, public.test_results from anon, authenticated;
revoke all on public.code_batch_summary from anon, authenticated;
revoke execute on function public.create_code_batch(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_expired_codes() from public, anon, authenticated;
revoke execute on function public.redeem_code(text, integer) from public, anon, authenticated;
revoke execute on function public.start_test_attempt(uuid) from public, anon, authenticated;
revoke execute on function public.complete_test_attempt(uuid, uuid, text, jsonb) from public, anon, authenticated;

grant usage on schema public to service_role;
grant all on public.admin_profiles, public.code_batches, public.redeem_codes, public.redeem_sessions, public.test_attempts, public.test_results to service_role;
grant select on public.code_batch_summary to service_role;
grant execute on function public.create_code_batch(uuid) to service_role;
grant execute on function public.refresh_expired_codes() to service_role;
grant execute on function public.redeem_code(text, integer) to service_role;
grant execute on function public.start_test_attempt(uuid) to service_role;
grant execute on function public.complete_test_attempt(uuid, uuid, text, jsonb) to service_role;

comment on table public.redeem_codes is '销售渠道导入的唯一兑换码；前端无直接访问权。';
comment on table public.test_results is '匿名结果统计，只保存人格、维度分数和关联兑换码，不保存20题答案。';
