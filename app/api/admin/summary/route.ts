import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/server/admin";
import { apiError, unexpectedError } from "@/lib/server/http";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET() {
  try {
    if (!(await requireAdmin())) return apiError("请先登录管理员账户。", 401, "UNAUTHORIZED");
    const supabase = createServiceClient();
    await supabase.rpc("refresh_expired_codes");
    const [{ data: codeStats, error: codeError }, { data: typeStats, error: typeError }, { data: batches, error: batchError }] = await Promise.all([
      supabase.from("redeem_codes").select("status"),
      supabase.from("test_results").select("personality_type"),
      supabase.from("code_batch_summary").select("*").order("created_at", { ascending: false }).limit(20),
    ]);
    if (codeError || typeError || batchError) throw codeError ?? typeError ?? batchError;
    const codes = { total: codeStats.length, unused: 0, active: 0, expired: 0, disabled: 0 };
    codeStats.forEach(({ status }) => { if (status in codes) codes[status as keyof typeof codes] += 1; });
    const personalities = Array.from({ length: 16 }, (_, index) => ({
      id: String(index + 1).padStart(2, "0"),
      count: typeStats.filter((row) => row.personality_type === String(index + 1).padStart(2, "0")).length,
    }));
    return NextResponse.json({ ok: true, codes, totalCompleted: typeStats.length, personalities, batches });
  } catch (error) {
    return unexpectedError(error);
  }
}
