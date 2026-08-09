import { ResultExperience } from "@/components/result-experience";
import { PREMIUM_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function PremiumResultPage() {
  if (!PREMIUM_MODE) notFound();
  return <ResultExperience />;
}
