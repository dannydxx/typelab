import { describe, expect, it, vi } from "vitest";
import { createLocalAttemptId } from "./local-attempt-id";

describe("createLocalAttemptId", () => {
  it("uses randomUUID when the browser provides it", () => {
    const randomUUID = vi.fn(() => "browser-uuid");

    expect(createLocalAttemptId({ randomUUID })).toBe("browser-uuid");
    expect(randomUUID).toHaveBeenCalledOnce();
  });

  it("creates a local fallback in an insecure mobile browser context", () => {
    expect(createLocalAttemptId({}, 1_723_300_000_000, 0.25)).toMatch(/^free-[a-z0-9]+-[a-z0-9]+$/);
  });
});
