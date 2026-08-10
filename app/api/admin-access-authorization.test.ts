import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const routeSources = [
  "./admin/summary/route.ts",
  "./admin/access-codes/generate/route.ts",
  "./admin/access-codes/revoke-unused/route.ts",
].map((path) => readFileSync(new URL(path, import.meta.url), "utf8"));

describe("Access Code administrator authorization coverage", () => {
  it("protects inventory statistics, one-time export, and batch revocation on the server", () => {
    for (const source of routeSources) {
      expect(source).toContain("requireAdmin");
      expect(source).toContain("UNAUTHORIZED");
      expect(source).not.toMatch(/localStorage|admin=true|searchParams\.get\(["']admin/);
    }
  });
});
