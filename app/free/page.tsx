import { FreeHomeExperience } from "@/components/free-home-experience";
import { FREE_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function FreePage() {
  if (!FREE_MODE) notFound();
  return <FreeHomeExperience />;
}
