-- =====================================================================
-- Gate 05D — Fix 42702 ambiguous column "access_code_id" in
-- public.activate_access_code
--
-- Root cause: the function declares `RETURNS TABLE (access_code_id uuid, ...)`
-- which makes `access_code_id` a PL/pgSQL OUT variable. Inside the body the
-- `INSERT ... ON CONFLICT (access_code_id)` referenced the column name WITHOUT
-- a table qualifier, so PostgreSQL could not tell whether it meant the PL/pgSQL
-- OUT variable or the access_sessions.access_code_id table column -> 42702.
--
-- Fix: reference the already-existing unique constraint by name via
-- `ON CONFLICT ON CONSTRAINT access_sessions_access_code_id_key`, which
-- sidesteps the ambiguous unqualified column reference entirely.
-- Function name, parameter names, return field names and return types are
-- unchanged, so no application code or RPC contract is affected.
-- This migration only replaces the one function; it does not touch the
-- already-applied clean base migration.
-- =====================================================================

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
  on conflict on constraint access_sessions_access_code_id_key do update
  set token_hash = excluded.token_hash, created_at = now(), expires_at = excluded.expires_at, last_seen_at = now();
  return query select v_code.id, v_code.status, v_session_expiry;
end;
$$;

-- CREATE OR REPLACE preserves ownership/grants, but re-state them defensively
-- to guarantee the permission state regardless of apply order.
revoke execute on function public.activate_access_code(text, text, integer) from public, anon, authenticated;
grant execute on function public.activate_access_code(text, text, integer) to service_role;
