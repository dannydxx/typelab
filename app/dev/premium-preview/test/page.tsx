import { notFound } from "next/navigation";
import { DevPremiumTestExperience } from "@/components/dev-premium-test-experience";

export const dynamic = "force-dynamic";

export default function DevPremiumTestPage() {
  if (process.env.NODE_ENV !== "development") notFound();
  return <DevPremiumTestExperience />;
}
