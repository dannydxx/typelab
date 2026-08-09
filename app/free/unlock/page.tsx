import { PurchaseGuide } from "@/components/purchase-guide";
import { FREE_MODE, PREMIUM_MODE } from "@/lib/config";
import { notFound } from "next/navigation";

export default function FreeUnlockPage() {
  if (!FREE_MODE || !PREMIUM_MODE) notFound();
  return <PurchaseGuide />;
}
