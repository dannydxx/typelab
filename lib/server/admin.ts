import "server-only";
import { cookies } from "next/headers";
import { createServiceClient } from "@/lib/supabase/service";

export const ADMIN_ACCESS_COOKIE = "love_admin_access";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get(ADMIN_ACCESS_COOKIE)?.value;
  if (!accessToken) return null;

  const supabase = createServiceClient();
  const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);
  if (authError || !authData.user) return null;

  const { data: profile } = await supabase
    .from("admin_profiles")
    .select("id")
    .eq("id", authData.user.id)
    .maybeSingle();
  return profile ? authData.user : null;
}
