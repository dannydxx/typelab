import { notFound } from "next/navigation";
import { ShareVisualQa } from "@/components/share-visual-qa";
import { PERSONALITIES } from "@/lib/personalities";
import { selectFreePersonalityPreview } from "@/lib/server/free-personality-preview";
import type { DimensionScores, StoredResult } from "@/lib/types";

export const dynamic = "force-dynamic";

function createVisualQaResult(personality: (typeof PERSONALITIES)[number]): StoredResult {
  const scores: DimensionScores = {
    security: personality.poles[0] === "sensitive" ? 6 : -6,
    closeness: personality.poles[1] === "close" ? 6 : -6,
    expression: personality.poles[2] === "direct" ? 6 : -6,
    conflict: personality.poles[3] === "resolve" ? 6 : -6,
  };

  return {
    attemptId: `visual-qa-type-${personality.id}`,
    personalityId: personality.id,
    scores,
    completedAt: "2026-01-01T00:00:00.000Z",
  };
}

export default function SharePreviewPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const entries = PERSONALITIES.map((personality) => {
    const freePreview = selectFreePersonalityPreview(personality);
    if (!freePreview) throw new Error(`FREE_PREVIEW_MISSING_TYPE_${personality.id}`);
    return {
      personality,
      freePreview,
      result: createVisualQaResult(personality),
    };
  });

  return <ShareVisualQa entries={entries} />;
}
