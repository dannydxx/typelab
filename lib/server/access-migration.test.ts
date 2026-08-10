import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(new URL("../../supabase/migrations/20260811_external_access_codes.sql", import.meta.url), "utf8");

describe("external commerce Access Code migration", () => {
  it("stores hashes and never introduces a plaintext code column", () => {
    expect(migration).toContain("code_hash text not null unique");
    expect(migration).not.toMatch(/\bcode\s+text\s+not\s+null/);
  });

  it("enforces one Access Code per attempt and result", () => {
    expect(migration).toContain("test_attempts_access_code_unique");
    expect(migration).toContain("test_results_access_code_unique");
    expect(migration).toContain("if v_code.attempt_id is not null");
    expect(migration).toContain("access_sessions_code_unique");
    expect(migration).toContain("for update");
    expect(migration).toContain("on conflict (access_code_id) do update");
  });

  it("preserves active attempt and result tables without destructive drops", () => {
    expect(migration).toContain("alter table public.test_attempts");
    expect(migration).toContain("alter table public.test_results");
    expect(migration).not.toMatch(/drop\s+table/i);
  });

  it("keeps business tables private and RPCs service-only", () => {
    expect(migration).toContain("enable row level security");
    expect(migration).toContain("revoke all on public.access_code_batches, public.access_codes, public.access_sessions, public.access_activation_rate_limits from anon, authenticated");
    expect(migration).toContain("grant execute on function public.activate_access_code");
  });

  it("retains completed results and gives them a separate read-only view window", () => {
    expect(migration).toContain("result_view_expires_at");
    expect(migration).toContain("p_result_view_days integer default 30");
    expect(migration).not.toMatch(/delete\s+from\s+public\.test_results/i);
  });

  it("atomically rate limits activation attempts without storing IP plaintext", () => {
    expect(migration).toContain("consume_access_activation_attempt");
    expect(migration).toContain("identifier_hash text primary key");
    expect(migration).toContain("blocked_until");
  });

  it("revokes only UNUSED inventory in a selected batch", () => {
    expect(migration).toContain("revoke_unused_access_code_batch");
    expect(migration).toContain("where batch_id = p_batch_id and status = 'UNUSED'");
    expect(migration).not.toMatch(/status\s*=\s*'REVOKED'[^;]+status\s*=\s*'ACTIVE'/);
  });
});
