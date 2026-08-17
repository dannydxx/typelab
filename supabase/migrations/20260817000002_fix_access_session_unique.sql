-- Gate 05B: fix activate_access_code ON CONFLICT (access_code_id)
-- The clean base's access_sessions lacks a UNIQUE constraint on access_code_id,
-- which activate_access_code relies on for its ON CONFLICT ... DO UPDATE clause.
-- Adding the constraint makes the RPC's upsert valid (Postgres 42P10 fix).

alter table public.access_sessions
  add constraint access_sessions_access_code_id_key
  unique (access_code_id);
