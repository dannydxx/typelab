-- TypeLab Clean Base Migration (V3.6.1 access-code system only)
-- Intended to be applied ALONE to an EMPTY public schema.
-- Replaces the legacy 16型 redeem system and the XHS premium entitlement system.
--
-- Scope (frozen database design):
--   - access-code delivery + activation + rate-limit system
--   - admin_profiles (server-side admin mapping)
--   - test_attempts / test_results keyed by access_code_id (single source of truth)
-- NOT included (deliberately omitted):
--   - legacy redeem_codes / redeem_sessions / code_batches / redeem_code_status
--   - legacy functions: set_updated_at / create_code_batch / refresh_expired_codes
--       / redeem_code / start_test_attempt / complete_test_attempt
--   - premium entitlement system: premium_entitlements / premium_test_attempts
--       / premium_test_results / start_entitled_test_attempt / complete_entitled_test_attempt
--   - view: code_batch_summary

create extension if not exists pgcrypto;

-- =====================================================================
-- 1. ENUMS
-- =====================================================================

do $$ begin
  create type public.test_attempt_status as enum ('started', 'completed', 'abandoned');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.access_code_status as enum ('UNUSED', 'ACTIVE', 'EXPIRED', 'REVOKED');
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- 2. TABLES
-- =====================================================================

create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.access_code_batches (
  id uuid primary key default gen_random_uuid(),
  label text not null check (char_length(label) between 1 and 120),
  code_count integer not null check (code_count between 1 and 5000),
  validity_hours integer not null default 72 check (validity_hours between 1 and 720),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- NOTE: attempt_id has no inline FK here because test_attempts is created later.
-- The FK is added in section 3 (ALTER) after test_attempts exists.
create table if not exists public.access_codes (
  id uuid primary key default gen_random_uuid(),
  code_hash text not null unique check (code_hash ~ '^[a-f0-9]{64}$'),
  batch_id uuid not null references public.access_code_batches(id) on delete restrict,
  status public.access_code_status not null default 'UNUSED',
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  expires_at timestamptz,
  result_view_expires_at timestamptz,
  attempt_id uuid,
  last_seen_at timestamptz
);

create table if not exists public.access_sessions (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.access_codes(id) on delete restrict,
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  last_seen_at timestamptz not null default now()
);

create table if not exists public.access_activation_rate_limits (
  identifier_hash text primary key check (identifier_hash ~ '^[a-f0-9]{64}$'),
  window_started_at timestamptz not null default now(),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  blocked_until timestamptz,
  updated_at timestamptz not null default now()
);

-- Clean access-code shape: access_code_id is the single, mandatory source of truth.
-- No redeem_code_id / redeem_codes FK is created.
create table if not exists public.test_attempts (
  id uuid primary key default gen_random_uuid(),
  access_code_id uuid not null references public.access_codes(id) on delete restrict,
  status public.test_attempt_status not null default 'started',
  started_at timestamptz not null default now(),
  completed_at timestamptz
);

create table if not exists public.test_results (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null unique references public.test_attempts(id) on delete restrict,
  access_code_id uuid not null references public.access_codes(id) on delete restrict,
  personality_type text not null check (personality_type ~ '^(0[1-9]|1[0-6])$'),
  dimension_scores jsonb not null check (
    dimension_scores ?& array['security', 'closeness', 'expression', 'conflict']
  ),
  completed_at timestamptz not null default now()
);

-- =====================================================================
-- 3. CIRCULAR FK RESOLUTION
--    access_codes.attempt_id <-> test_attempts.access_code_id
--    (test_attempts.access_code_id was created with inline FK above)
-- =====================================================================

do $$ begin
  alter table public.access_codes add constraint access_codes_attempt_id_fkey
    foreign key (attempt_id) references public.test_attempts(id) on delete restrict;
exception when duplicate_object then null;
end $$;

-- =====================================================================
-- 4. INDEXES
-- =====================================================================

create unique index if not exists test_attempts_access_code_unique
  on public.test_attempts(access_code_id) where access_code_id is not null;

create unique index if not exists test_results_access_code_unique
  on public.test_results(access_code_id) where access_code_id is not null;

create unique index if not exists access_sessions_code_unique
  on public.access_sessions(access_code_id);

create index if not exists access_codes_batch_status_idx
  on public.access_codes(batch_id, status);

create index if not exists access_codes_expiry_idx
  on public.access_codes(expires_at) where status = 'ACTIVE';

create index if not exists test_results_type_idx
  on public.test_results(personality_type);

create index if not exists test_results_completed_idx
  on public.test_results(completed_at desc);

-- =====================================================================
-- 5. FUNCTIONS / RPC (8 runtime RPCs)
-- =====================================================================

create or replace function public.create_access_code_batch(
  p_label text,
  p_code_hashes text[],
  p_validity_hours integer,
  p_created_by uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_batch_id uuid;
  v_count integer := coalesce(array_length(p_code_hashes, 1), 0);
begin
  if v_count < 1 or v_count > 5000 then raise exception 'INVALID_BATCH_COUNT'; end if;
  if exists (select 1 from unnest(p_code_hashes) as item(value) where value !~ '^[a-f0-9]{64}$') then raise exception 'INVALID_CODE_HASH'; end if;
  if (select count(distinct value) from unnest(p_code_hashes) as item(value)) <> v_count then raise exception 'DUPLICATE_CODE_HASH'; end if;
  insert into public.access_code_batches(label, code_count, validity_hours, created_by)
  values (p_label, v_count, p_validity_hours, p_created_by)
  returning id into v_batch_id;
  insert into public.access_codes(batch_id, code_hash)
  select v_batch_id, value from unnest(p_code_hashes) as item(value);
  return v_batch_id;
end;
$$;

create or replace function public.revoke_unused_access_code_batch(p_batch_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  perform 1 from public.access_code_batches where id = p_batch_id for update;
  if not found then raise exception 'BATCH_NOT_FOUND'; end if;
  update public.access_codes set status = 'REVOKED' where batch_id = p_batch_id and status = 'UNUSED';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.refresh_expired_access_codes()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
begin
  update public.access_codes
  set status = 'EXPIRED'
  where status = 'ACTIVE' and (
    (result_view_expires_at is null and expires_at <= now())
    or (result_view_expires_at is not null and result_view_expires_at <= now())
  );
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

create or replace function public.consume_access_activation_attempt(
  p_identifier_hash text,
  p_max_attempts integer,
  p_window_seconds integer,
  p_block_seconds integer
)
returns table (allowed boolean, retry_after_seconds integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit public.access_activation_rate_limits%rowtype;
begin
  insert into public.access_activation_rate_limits(identifier_hash)
  values (p_identifier_hash)
  on conflict (identifier_hash) do nothing;
  select * into v_limit from public.access_activation_rate_limits where identifier_hash = p_identifier_hash for update;

  if v_limit.blocked_until is not null and v_limit.blocked_until > now() then
    return query select false, greatest(1, ceil(extract(epoch from (v_limit.blocked_until - now())))::integer);
    return;
  end if;
  if v_limit.window_started_at <= now() - make_interval(secs => p_window_seconds) then
    update public.access_activation_rate_limits
    set window_started_at = now(), attempt_count = 1, blocked_until = null, updated_at = now()
    where identifier_hash = p_identifier_hash;
    return query select true, 0;
    return;
  end if;
  if v_limit.attempt_count + 1 > p_max_attempts then
    update public.access_activation_rate_limits
    set attempt_count = attempt_count + 1, blocked_until = now() + make_interval(secs => p_block_seconds), updated_at = now()
    where identifier_hash = p_identifier_hash;
    return query select false, p_block_seconds;
    return;
  end if;
  update public.access_activation_rate_limits set attempt_count = attempt_count + 1, updated_at = now() where identifier_hash = p_identifier_hash;
  return query select true, 0;
end;
$$;

create or replace function public.clear_access_activation_failures(p_identifier_hash text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from public.access_activation_rate_limits where identifier_hash = p_identifier_hash;
end;
$$;

create or replace function public.activate_access_code(
  p_code_hash text,
  p_token_hash text,
  p_test_hours integer default 72
)
returns table (access_code_id uuid, state public.access_code_status, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.access_codes%rowtype;
  v_validity_hours integer;
  v_session_expiry timestamptz;
begin
  select * into v_code from public.access_codes where code_hash = p_code_hash for update;
  if not found then return; end if;
  select validity_hours into v_validity_hours from public.access_code_batches where id = v_code.batch_id;

  if v_code.status = 'REVOKED' or v_code.status = 'EXPIRED' then
    return query select v_code.id, v_code.status, coalesce(v_code.result_view_expires_at, v_code.expires_at);
    return;
  end if;
  if v_code.result_view_expires_at is not null then
    if v_code.result_view_expires_at <= now() then
      update public.access_codes set status = 'EXPIRED' where id = v_code.id returning * into v_code;
      return query select v_code.id, v_code.status, v_code.result_view_expires_at;
      return;
    end if;
    v_session_expiry := v_code.result_view_expires_at;
  else
    if v_code.status = 'ACTIVE' and v_code.expires_at <= now() then
      update public.access_codes set status = 'EXPIRED' where id = v_code.id returning * into v_code;
      return query select v_code.id, v_code.status, v_code.expires_at;
      return;
    end if;
    if v_code.status = 'UNUSED' then
      update public.access_codes
      set status = 'ACTIVE', activated_at = now(), expires_at = now() + make_interval(hours => coalesce(v_validity_hours, p_test_hours)), last_seen_at = now()
      where id = v_code.id returning * into v_code;
    else
      update public.access_codes set last_seen_at = now() where id = v_code.id returning * into v_code;
    end if;
    v_session_expiry := v_code.expires_at;
  end if;

  insert into public.access_sessions(access_code_id, token_hash, expires_at)
  values (v_code.id, p_token_hash, v_session_expiry)
  on conflict (access_code_id) do update
  set token_hash = excluded.token_hash, created_at = now(), expires_at = excluded.expires_at, last_seen_at = now();
  return query select v_code.id, v_code.status, v_session_expiry;
end;
$$;

create or replace function public.start_access_test_attempt(p_access_code_id uuid)
returns table (attempt_id uuid, attempt_status public.test_attempt_status)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.access_codes%rowtype;
  v_attempt public.test_attempts%rowtype;
begin
  select * into v_code from public.access_codes where id = p_access_code_id for update;
  if not found then raise exception 'ACCESS_NOT_FOUND'; end if;
  if v_code.status = 'REVOKED' then raise exception 'ACCESS_REVOKED'; end if;

  if v_code.attempt_id is not null then
    select * into v_attempt from public.test_attempts where id = v_code.attempt_id and access_code_id = v_code.id;
    if not found then raise exception 'ATTEMPT_INVALID'; end if;
    if v_attempt.status = 'completed' then
      if v_code.result_view_expires_at is null or v_code.result_view_expires_at <= now() then raise exception 'ACCESS_EXPIRED'; end if;
      return query select v_attempt.id, v_attempt.status;
      return;
    end if;
    if v_attempt.status <> 'started' then raise exception 'ATTEMPT_INVALID'; end if;
    if v_code.status <> 'ACTIVE' or v_code.expires_at <= now() then raise exception 'ACCESS_EXPIRED'; end if;
    return query select v_attempt.id, v_attempt.status;
    return;
  end if;

  if v_code.status <> 'ACTIVE' or v_code.expires_at <= now() then raise exception 'ACCESS_EXPIRED'; end if;
  insert into public.test_attempts(access_code_id) values (v_code.id) returning * into v_attempt;
  update public.access_codes set attempt_id = v_attempt.id, last_seen_at = now() where id = v_code.id;
  return query select v_attempt.id, v_attempt.status;
end;
$$;

create or replace function public.complete_access_test_attempt(
  p_access_code_id uuid,
  p_attempt_id uuid,
  p_personality_type text,
  p_dimension_scores jsonb,
  p_result_view_days integer default 30
)
returns table (completed_now boolean, result_expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_code public.access_codes%rowtype;
  v_attempt public.test_attempts%rowtype;
  v_result_expiry timestamptz;
begin
  select * into v_code from public.access_codes where id = p_access_code_id for update;
  if not found or v_code.attempt_id <> p_attempt_id then raise exception 'ATTEMPT_INVALID'; end if;
  if v_code.status = 'REVOKED' then raise exception 'ACCESS_REVOKED'; end if;
  select * into v_attempt from public.test_attempts where id = p_attempt_id and access_code_id = p_access_code_id for update;
  if not found then raise exception 'ATTEMPT_INVALID'; end if;
  if v_attempt.status = 'completed' then
    if v_code.result_view_expires_at is null or v_code.result_view_expires_at <= now() then raise exception 'ACCESS_EXPIRED'; end if;
    return query select false, v_code.result_view_expires_at;
    return;
  end if;
  if v_attempt.status <> 'started' then raise exception 'ATTEMPT_INVALID'; end if;
  if v_code.status <> 'ACTIVE' or v_code.expires_at <= now() then raise exception 'ACCESS_EXPIRED'; end if;

  insert into public.test_results(attempt_id, access_code_id, personality_type, dimension_scores)
  values (p_attempt_id, p_access_code_id, p_personality_type, p_dimension_scores);
  update public.test_attempts set status = 'completed', completed_at = now() where id = p_attempt_id;
  v_result_expiry := now() + make_interval(days => p_result_view_days);
  update public.access_codes set result_view_expires_at = v_result_expiry, last_seen_at = now() where id = p_access_code_id;
  update public.access_sessions set expires_at = v_result_expiry, last_seen_at = now() where access_code_id = p_access_code_id;
  return query select true, v_result_expiry;
end;
$$;

-- =====================================================================
-- 6. ROW LEVEL SECURITY + PERMISSIONS
-- =====================================================================

grant usage on schema public to service_role;

alter table public.admin_profiles enable row level security;
alter table public.access_code_batches enable row level security;
alter table public.access_codes enable row level security;
alter table public.access_sessions enable row level security;
alter table public.access_activation_rate_limits enable row level security;
alter table public.test_attempts enable row level security;
alter table public.test_results enable row level security;

-- anon / authenticated must never touch business tables or RPCs.
revoke all on public.admin_profiles, public.access_code_batches, public.access_codes,
  public.access_sessions, public.access_activation_rate_limits,
  public.test_attempts, public.test_results
  from anon, authenticated;

revoke execute on function public.create_access_code_batch(text, text[], integer, uuid) from public, anon, authenticated;
revoke execute on function public.revoke_unused_access_code_batch(uuid) from public, anon, authenticated;
revoke execute on function public.refresh_expired_access_codes() from public, anon, authenticated;
revoke execute on function public.consume_access_activation_attempt(text, integer, integer, integer) from public, anon, authenticated;
revoke execute on function public.clear_access_activation_failures(text) from public, anon, authenticated;
revoke execute on function public.activate_access_code(text, text, integer) from public, anon, authenticated;
revoke execute on function public.start_access_test_attempt(uuid) from public, anon, authenticated;
revoke execute on function public.complete_access_test_attempt(uuid, uuid, text, jsonb, integer) from public, anon, authenticated;

-- service_role (server-side API) owns all access.
grant all on public.admin_profiles, public.access_code_batches, public.access_codes,
  public.access_sessions, public.access_activation_rate_limits,
  public.test_attempts, public.test_results
  to service_role;

grant execute on function public.create_access_code_batch(text, text[], integer, uuid) to service_role;
grant execute on function public.revoke_unused_access_code_batch(uuid) to service_role;
grant execute on function public.refresh_expired_access_codes() to service_role;
grant execute on function public.consume_access_activation_attempt(text, integer, integer, integer) to service_role;
grant execute on function public.clear_access_activation_failures(text) to service_role;
grant execute on function public.activate_access_code(text, text, integer) to service_role;
grant execute on function public.start_access_test_attempt(uuid) to service_role;
grant execute on function public.complete_access_test_attempt(uuid, uuid, text, jsonb, integer) to service_role;

-- =====================================================================
-- 7. COMMENTS
-- =====================================================================

comment on table public.access_codes is '外部交易完成后交付的一单一码访问凭证；仅保存不可逆HMAC摘要。';
comment on table public.access_sessions is 'HttpOnly访问会话；浏览器仅持有随机token，数据库仅保存摘要。';
comment on table public.access_activation_rate_limits is '匿名化客户端摘要的短时激活限流状态；不保存IP或访问码明文。';
comment on table public.test_results is '匿名结果统计，只保存人格、维度分数和关联访问码，不保存20题答案。';
comment on table public.admin_profiles is '服务端管理员映射；仅由 service_role 写入。';
