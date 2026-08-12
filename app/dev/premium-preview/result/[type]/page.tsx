import { notFound } from "next/navigation";
import { ResultExperience } from "@/components/result-experience";
import { createDevPremiumResult } from "@/lib/dev-premium-preview";
import { PERSONALITY_BY_ID } from "@/lib/personalities";

export const dynamic = "force-dynamic";

export default async function DevPremiumResultPage({ params }: { params: Promise<{ type: string }> }) {
  if (process.env.NODE_ENV !== "development") notFound();
  const { type } = await params;
  const personality = PERSONALITY_BY_ID[type];
  if (!personality) notFound();
  return <ResultExperience result={createDevPremiumResult(personality)} devPreview />;
}
