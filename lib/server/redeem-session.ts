import "server-only";
import { createServiceClient } from "@/lib/supabase/service";
import { hashSessionToken } from "./security";

export async function getRedeemSession(token: string | null) {
  if (!token || token.length < 32) return null;
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("redeem_sessions")
    .select("id, redeem_code_id, expires_at")
    .eq("token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString())
    .maybeSingle();
  if (error || !data) return null;
  return data;
}
