import { notFound, redirect } from "next/navigation";
import { ResultExperience } from "@/components/result-experience";
import { PREMIUM_MODE } from "@/lib/config";
import { PERSONALITY_BY_ID } from "@/lib/personalities";
import { getPremiumResultForAccess } from "@/lib/server/premium-access";
import { getAccessSessionFromServerCookies } from "@/lib/server/access-session";
import type { DimensionScores, StoredResult } from "@/lib/types";

function previewResult(personalityId: string): StoredResult | null {
  const personality = PERSONALITY_BY_ID[personalityId];
  if (!personality) return null;
  const scores: DimensionScores = {
    security: personality.poles[0] === "sensitive" ? 6 : -6,
    closeness: personality.poles[1] === "close" ? 6 : -6,
    expression: personality.poles[2] === "direct" ? 6 : -6,
    conflict: personality.poles[3] === "resolve" ? 6 : -6,
  };
  return {
    attemptId: "00000000-0000-4000-8000-000000000000",
    personalityId,
    scores,
    completedAt: new Date().toISOString(),
  };
}

export default async function PremiumResultPage({
  searchParams,
}: {
  searchParams: Promise<{ preview?: string }>;
}) {
  if (!PREMIUM_MODE) notFound();
  const params = await searchParams;
  if (process.env.NODE_ENV === "development" && params.preview) {
    const result = previewResult(params.preview);
    if (result) return <ResultExperience result={result} />;
  }

  const identity = await getAccessSessionFromServerCookies();
  if (!identity) redirect("/premium");
  const result = await getPremiumResultForAccess(identity);
  if (!result) redirect("/premium");

  return <ResultExperience result={result} />;
}
