import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

const mocks = vi.hoisted(() => ({ requireAdmin: vi.fn(), rpc: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/lib/server/admin", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/lib/supabase/service", () => ({ createServiceClient: () => ({ rpc: mocks.rpc }) }));

import { POST } from "./admin/access-codes/generate/route";
import { POST as revokeUnused } from "./admin/access-codes/revoke-unused/route";

function request(format: "csv" | "txt" = "csv") {
  return new NextRequest("http://localhost/api/admin/access-codes/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label: "小红书第一批", count: 10, format }),
  });
}

describe("Access Code inventory generation", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireAdmin.mockResolvedValue({ id: "00000000-0000-4000-8000-000000000001" });
    mocks.rpc.mockResolvedValue({ data: "00000000-0000-4000-8000-000000000099", error: null });
  });

  it("requires an administrator", async () => {
    mocks.requireAdmin.mockResolvedValue(null);
    expect((await POST(request())).status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("returns a one-time no-store CSV while persisting only hashes", async () => {
    const response = await POST(request("csv"));
    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toContain("text/csv");
    expect(response.headers.get("cache-control")).toContain("no-store");
    const text = await response.text();
    const codes = text.match(/[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}/g) ?? [];
    expect(codes).toHaveLength(10);
    const rpcPayload = mocks.rpc.mock.calls[0][1];
    expect(rpcPayload.p_code_hashes).toHaveLength(10);
    expect(rpcPayload.p_code_hashes.every((hash: string) => /^[a-f0-9]{64}$/.test(hash))).toBe(true);
    expect(JSON.stringify(rpcPayload)).not.toContain(codes[0]);
  });

  it("supports a one-code-per-line TXT export", async () => {
    const response = await POST(request("txt"));
    expect(response.headers.get("content-type")).toContain("text/plain");
    expect((await response.text()).trim().split("\r\n")).toHaveLength(10);
  });

  it("rejects unauthenticated batch revocation", async () => {
    mocks.requireAdmin.mockResolvedValue(null);
    const response = await revokeUnused(new NextRequest("http://localhost/api/admin/access-codes/revoke-unused", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: "00000000-0000-4000-8000-000000000099" }),
    }));
    expect(response.status).toBe(401);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });

  it("revokes only UNUSED inventory through the protected database RPC", async () => {
    mocks.rpc.mockResolvedValue({ data: 37, error: null });
    const response = await revokeUnused(new NextRequest("http://localhost/api/admin/access-codes/revoke-unused", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ batchId: "00000000-0000-4000-8000-000000000099" }),
    }));
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ revokedCount: 37 });
    expect(mocks.rpc).toHaveBeenCalledWith("revoke_unused_access_code_batch", { p_batch_id: "00000000-0000-4000-8000-000000000099" });
  });
});
