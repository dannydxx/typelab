import { notFound, redirect } from "next/navigation";
import { ResultExperience } from "@/components/result-experience";
import { PREMIUM_MODE } from "@/lib/config";
import { getPremiumResultForAccess } from "@/lib/server/premium-access";
import { getAccessSessionFromServerCookies } from "@/lib/server/access-session";

export default async function PremiumResultPage() {
  if (!PREMIUM_MODE) notFound();

  const identity = await getAccessSessionFromServerCookies();
  if (!identity) redirect("/premium");
  const result = await getPremiumResultForAccess(identity);
  if (!result) redirect("/premium");

  return <ResultExperience result={result} />;
}
