import { notFound } from "next/navigation";
import { FreeHomeExperience } from "@/components/free-home-experience";
import { FREE_MODE } from "@/lib/config";

export default function HomePage() {
  if (!FREE_MODE) notFound();
  return <FreeHomeExperience />;
}
