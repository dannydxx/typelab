import React from "react";
import { readFileSync } from "node:fs";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { LockedReportPreview } from "@/components/locked-report-preview";
import { PreliminaryRelationshipPreview, freeScoreToPercent } from "@/components/preliminary-relationship-preview";
import { PERSONALITIES } from "./personalities";
import { getFreeRedeemAction } from "./free-result-conversion";
import { parseFreeStoredResult } from "./free-stored-result";
import { getConfiguredPurchaseUrl } from "./purchase-config";
import { selectFreePersonalityPreview } from "./server/free-personality-preview";

describe("free result conversion experience", () => {
  const personality = PERSONALITIES[0];
  const v2 = personality.v2!;
  const preview = selectFreePersonalityPreview(personality)!;

  it("normalizes free scores across the full -4 to +4 range", () => {
    expect(freeScoreToPercent(-4)).toBe(0);
    expect(freeScoreToPercent(0)).toBe(50);
    expect(freeScoreToPercent(4)).toBe(100);
  });

  it("renders preliminary coordinates without premium interpretations", () => {
    const html = renderToStaticMarkup(
      <PreliminaryRelationshipPreview
        scores={{ security: -4, closeness: 4, expression: 0, conflict: 2 }}
        definitions={preview.relationshipPosition}
      />,
    );
    expect(html).toContain("left:0%");
    expect(html).toContain("left:100%");
    expect(html).toContain("完整版将通过20道题重新校准");
    expect(html).not.toContain(v2.relationshipPosition[0].interpretation);
  });

  it("renders only the permitted personalized locked-preview fields", () => {
    const html = renderToStaticMarkup(<LockedReportPreview preview={preview} />);
    expect(html).toContain(v2.boundaries.items[0].title);
    expect(html).toContain(v2.innerOS[0].situation);
    expect(html).toContain(v2.innerOS[0].outer);
    expect(html).not.toContain(v2.boundaries.items[0].description);
    expect(html).not.toContain(v2.boundaries.items[1].title);
    expect(html).not.toContain(v2.innerOS[0].inner);
  });

  it("starts a new premium attempt for a newly redeemed free user", () => {
    expect(getFreeRedeemAction({ authenticated: true, canStart: true, hasActiveAttempt: false, activeAttemptId: null, hasCompletedResult: false })).toBe("start-attempt");
  });

  it("resumes a server-confirmed active attempt before creating another", () => {
    expect(getFreeRedeemAction({ authenticated: true, canStart: true, hasActiveAttempt: true, activeAttemptId: "attempt-1", hasCompletedResult: false })).toBe("resume-attempt");
  });

  it("does not create a dead purchase link when purchaseUrl is empty or invalid", () => {
    expect(getConfiguredPurchaseUrl("")).toBeNull();
    expect(getConfiguredPurchaseUrl("javascript:alert(1)")).toBeNull();
    expect(getConfiguredPurchaseUrl("https://example.com/buy")).toBe("https://example.com/buy");
  });

  it("loads a valid free StoredResult without importing premium personality copy", () => {
    expect(parseFreeStoredResult(JSON.stringify({
      attemptId: "free-attempt",
      personalityId: "01",
      scores: { security: -4, closeness: 4, expression: 0, conflict: 2 },
      completedAt: "2026-08-10T12:00:00.000Z",
    }))).toMatchObject({ personalityId: "01" });
  });

  it("reuses the same RedeemCodePanel on the premium home and free result", () => {
    const homeSource = readFileSync(new URL("../components/home-experience.tsx", import.meta.url), "utf8");
    const freeResultSource = readFileSync(new URL("../components/free-result-experience.tsx", import.meta.url), "utf8");
    expect(homeSource).toContain("<RedeemCodePanel");
    expect(freeResultSource).toContain("<RedeemCodePanel");
  });
});
