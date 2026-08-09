import { FreeTestExperience } from "@/components/free-test-experience";
import { FREE_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function FreeTestPage() {
  if (!FREE_MODE) notFound();
  return <FreeTestExperience />;
}
