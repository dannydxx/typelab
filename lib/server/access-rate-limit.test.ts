import { describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));

import { getActivationClientIdentifier, hashActivationClientIdentifier } from "./access-rate-limit";

describe("Access activation rate-limit identity", () => {
  it("uses the server request IP without retaining plaintext", () => {
    const request = new NextRequest("http://localhost/api/access/activate", { headers: { "x-real-ip": "203.0.113.8" } });
    expect(getActivationClientIdentifier(request)).toBe("203.0.113.8");
    const hash = hashActivationClientIdentifier("203.0.113.8", "rate-limit-secret");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("203.0.113.8");
  });

  it("uses the first forwarded address when a real IP header is absent", () => {
    const request = new NextRequest("http://localhost/api/access/activate", { headers: { "x-forwarded-for": "198.51.100.3, 10.0.0.2" } });
    expect(getActivationClientIdentifier(request)).toBe("198.51.100.3");
  });

  it("fails closed in production without the rate-limit secret", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ACCESS_RATE_LIMIT_SECRET", "");
    expect(() => hashActivationClientIdentifier("203.0.113.8")).toThrow("ACCESS_RATE_LIMIT_SECRET_REQUIRED");
    vi.unstubAllEnvs();
  });
});
