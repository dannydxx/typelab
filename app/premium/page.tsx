import { HomeExperience } from "@/components/home-experience";
import { PREMIUM_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function PremiumPage() {
  if (!PREMIUM_MODE) notFound();
  return <HomeExperience />;
}
