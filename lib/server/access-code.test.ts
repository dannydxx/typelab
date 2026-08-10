import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { generateAccessCode, generateUniqueAccessCodes, hashAccessCode, isValidAccessCodeFormat, normalizeAccessCode } from "./access-code";

describe("Access Code security", () => {
  it("normalizes and validates the low-confusion XXXX-XXXX format", () => {
    expect(normalizeAccessCode("  abcd-2345 ")).toBe("ABCD-2345");
    expect(isValidAccessCodeFormat("ABCD-2345")).toBe(true);
    expect(isValidAccessCodeFormat("ABCO-1234")).toBe(false);
  });

  it("stores a deterministic HMAC instead of plaintext", () => {
    const hash = hashAccessCode("ABCD-2345", "test-secret");
    expect(hash).toMatch(/^[a-f0-9]{64}$/);
    expect(hash).not.toContain("ABCD");
    expect(hashAccessCode(" abcd-2345 ", "test-secret")).toBe(hash);
  });

  it("fails closed in production when the Access Code HMAC secret is missing", () => {
    vi.stubEnv("NODE_ENV", "production");
    vi.stubEnv("ACCESS_CODE_HASH_SECRET", "");
    expect(() => hashAccessCode("ABCD-2345")).toThrow("ACCESS_CODE_HASH_SECRET_REQUIRED");
    vi.unstubAllEnvs();
  });

  it("uses the supplied cryptographic byte source and excluded character pool", () => {
    const bytes = [0, 1, 2, 3, 4, 5, 6, 7];
    const random = () => Buffer.from([bytes.shift() ?? 8]);
    expect(generateAccessCode(undefined, random)).toMatch(/^[A-HJ-KM-NP-Z2-9]{4}-[A-HJ-KM-NP-Z2-9]{4}$/);
  });

  it("generates a unique batch", () => {
    const codes = generateUniqueAccessCodes(1000);
    expect(new Set(codes).size).toBe(1000);
    expect(codes.every(isValidAccessCodeFormat)).toBe(true);
  });

  it("never falls back to Math.random", () => {
    const source = readFileSync(new URL("./access-code.ts", import.meta.url), "utf8");
    expect(source).toContain("randomBytes");
    expect(source).not.toContain("Math.random");
  });
});
