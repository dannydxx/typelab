-- V3.5 additive migration: XHS entitlement-backed Premium access.
-- Legacy redeem tables are intentionally preserved for later audited cleanup.

create table if not exists public.premium_entitlements (
  id uuid primary key default gen_random_uuid(),
  source text not null check (source = 'xiaohongshu'),
  platform_user_id text not null,
  product_id text not null,
  order_id text not null,
  status text not null default 'active' check (status in ('active', 'revoked', 'refunded', 'expired')),
  granted_at timestamptz not null,
  revoked_at timestamptz,
  max_completed_count integer not null default 3 check (max_completed_count > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source, order_id)
);

create table if not exists public.premium_test_attempts (
  id uuid primary key default gen_random_uuid(),
  entitlement_id uuid not null references public.premium_entitlements(id) on delete restrict,
  platform_user_id text not null,
  status public.test_attempt_status not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.premium_test_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.premium_test_attempts(id) on delete restrict,
  entitlement_id uuid not null references public.premium_entitlements(id) on delete restrict,
  personality_type text not null check (personality_type ~ '^(0[1-9]|1[0-6])$'),
  dimension_scores jsonb not null check (dimension_scores ?& array['security', 'closeness', 'expression', 'conflict']),
  completed_at timestamptz not null default now()
);

create index if not exists premium_entitlements_user_idx on public.premium_entitlements(source, platform_user_id, status);
create index if not exists premium_attempts_entitlement_idx on public.premium_test_attempts(entitlement_id, started_at desc);
create index if not exists premium_results_entitlement_idx on public.premium_test_results(entitlement_id, completed_at desc);
create index if not exists premium_results_type_idx on public.premium_test_results(personality_type);

create or replace function public.start_entitled_test_attempt(p_entitlement_id uuid, p_platform_user_id text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_entitlement public.premium_entitlements%rowtype;
  v_attempt_id uuid;
  v_completed integer;
begin
  select * into v_entitlement from public.premium_entitlements where id = p_entitlement_id for update;
  if not found or v_entitlement.status <> 'active' or v_entitlement.platform_user_id <> p_platform_user_id then
    raise exception 'ENTITLEMENT_INVALID';
  end if;
  select count(*) into v_completed from public.premium_test_results where entitlement_id = p_entitlement_id;
  if v_completed >= v_entitlement.max_completed_count then raise exception 'LIMIT_REACHED'; end if;
  insert into public.premium_test_attempts(entitlement_id, platform_user_id)
  values (p_entitlement_id, p_platform_user_id) returning id into v_attempt_id;
  return v_attempt_id;
end;
$$;

create or replace function public.complete_entitled_test_attempt(
  p_entitlement_id uuid,
  p_platform_user_id text,
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
  v_entitlement public.premium_entitlements%rowtype;
  v_attempt public.premium_test_attempts%rowtype;
begin
  select * into v_entitlement from public.premium_entitlements where id = p_entitlement_id for update;
  if not found or v_entitlement.status <> 'active' or v_entitlement.platform_user_id <> p_platform_user_id then
    raise exception 'ENTITLEMENT_INVALID';
  end if;
  select * into v_attempt from public.premium_test_attempts
  where id = p_attempt_id and entitlement_id = p_entitlement_id and platform_user_id = p_platform_user_id for update;
  if not found then raise exception 'ATTEMPT_INVALID'; end if;
  if v_attempt.status = 'completed' then return false; end if;
  if v_attempt.status <> 'started' then raise exception 'ATTEMPT_INVALID'; end if;
  insert into public.premium_test_results(attempt_id, entitlement_id, personality_type, dimension_scores)
  values (p_attempt_id, p_entitlement_id, p_personality_type, p_dimension_scores);
  update public.premium_test_attempts set status = 'completed', completed_at = now() where id = p_attempt_id;
  return true;
end;
$$;

alter table public.premium_entitlements enable row level security;
alter table public.premium_test_attempts enable row level security;
alter table public.premium_test_results enable row level security;
revoke all on public.premium_entitlements, public.premium_test_attempts, public.premium_test_results from anon, authenticated;
revoke execute on function public.start_entitled_test_attempt(uuid, text) from public, anon, authenticated;
revoke execute on function public.complete_entitled_test_attempt(uuid, text, uuid, text, jsonb) from public, anon, authenticated;
grant all on public.premium_entitlements, public.premium_test_attempts, public.premium_test_results to service_role;
grant execute on function public.start_entitled_test_attempt(uuid, text) to service_role;
grant execute on function public.complete_entitled_test_attempt(uuid, text, uuid, text, jsonb) to service_role;
