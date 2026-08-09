import { TestExperience } from "@/components/test-experience";
import { PREMIUM_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function PremiumTestPage() {
  if (!PREMIUM_MODE) notFound();
  return <TestExperience />;
}
