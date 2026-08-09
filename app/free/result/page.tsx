import { FreeResultExperience } from "@/components/free-result-experience";
import { FREE_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function FreeResultPage() {
  if (!FREE_MODE) notFound();
  return <FreeResultExperience />;
}
